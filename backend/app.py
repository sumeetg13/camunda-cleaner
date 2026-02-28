from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os

def create_app():
    app = Flask(__name__, template_folder="templates")
    app.secret_key = "super-secret-key"
    CORS(app)  # Enable CORS for all routes

    CAMUNDA_AUTH = (
        os.getenv("CAMUNDA_USER", "demo"),
        os.getenv("CAMUNDA_PASSWORD", "demo")
    )
    CAMUNDA_BASE_URL = os.getenv(
        "CAMUNDA_BASE_URL",
        "http://localhost:8080/engine-rest"
    )

    @app.route("/", methods=["GET", "POST"])
    def index():
        # Serve React app in production, legacy template in development
        if os.path.exists("frontend/dist/index.html"):
            return send_from_directory("frontend/dist", "index.html")

        # Fallback to legacy template
        process_key = None
        deployments = {}

        if request.method == "POST":
            process_key = request.form.get("process_key")

            # Fetch process definitions
            pds = requests.get(
                f"{CAMUNDA_BASE_URL}/process-definition",
                params={"key": process_key},
                auth=CAMUNDA_AUTH
            ).json()

            for pd in pds:
                dep_id = pd["deploymentId"]
                pd_id = pd["id"]

                deployments.setdefault(dep_id, {
                    "processDefinitions": []
                })

                instances = requests.get(
                    f"{CAMUNDA_BASE_URL}/process-instance",
                    params={"processDefinitionId": pd_id},
                    auth=CAMUNDA_AUTH
                ).json()

                deployments[dep_id]["processDefinitions"].append({
                    "id": pd_id,
                    "key": pd["key"],
                    "version": pd["version"],
                    "instances": instances
                })

        return render_template(
            "index.html",
            process_key=process_key,
            deployments=deployments
        )

    # Serve static files from React build
    @app.route("/<path:path>")
    def serve_static(path):
        if os.path.exists(f"frontend/dist/{path}"):
            return send_from_directory("frontend/dist", path)
        return send_from_directory("frontend/dist", "index.html")
    # API: Get process definitions and instances
    @app.route("/api/process-definitions", methods=["GET"])
    def get_process_definitions():
        process_key = request.args.get("key")

        if not process_key:
            return jsonify({
                "success": False,
                "message": "Process key is required"
            }), 400

        try:
            # Fetch process definitions
            pds_response = requests.get(
                f"{CAMUNDA_BASE_URL}/process-definition",
                params={"key": process_key},
                auth=CAMUNDA_AUTH,
                timeout=10
            )
            pds_response.raise_for_status()
            pds = pds_response.json()

            deployments = {}

            for pd in pds:
                dep_id = pd["deploymentId"]
                pd_id = pd["id"]

                deployments.setdefault(dep_id, {
                    "processDefinitions": []
                })

                instances_response = requests.get(
                    f"{CAMUNDA_BASE_URL}/process-instance",
                    params={"processDefinitionId": pd_id},
                    auth=CAMUNDA_AUTH,
                    timeout=10
                )
                instances_response.raise_for_status()
                instances = instances_response.json()

                deployments[dep_id]["processDefinitions"].append({
                    "id": pd_id,
                    "key": pd["key"],
                    "version": pd["version"],
                    "instances": instances
                })

            return jsonify({
                "success": True,
                "process_key": process_key,
                "deployments": deployments
            })

        except Exception as e:
            return jsonify({
                "success": False,
                "message": f"Error fetching process definitions: {str(e)}"
            }), 500

    # API: Health check
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "camunda_url": CAMUNDA_BASE_URL
        })

    # ❌ Delete single process instance
    @app.route("/delete-instance", methods=["POST"])
    def delete_instance():
        instance_id = request.json.get("instance_id")

        res = requests.delete(
            f"{CAMUNDA_BASE_URL}/process-instance/{instance_id}",
            auth=CAMUNDA_AUTH
        )

        if res.status_code not in (200, 204):
            return jsonify({"success": False, "message": "Failed to delete"}), 400

        return jsonify({"success": True, "instance_id": instance_id})

    # 🔥 Delete all process instances for a deployment
    @app.route("/delete-deployment-instances", methods=["POST"])
    def delete_deployment_instances():
        deployment_id = request.json.get("deployment_id")

        if not deployment_id:
            return jsonify({"success": False, "message": "Deployment ID is required"}), 400

        try:
            pds = requests.get(
                f"{CAMUNDA_BASE_URL}/process-definition",
                params={"deploymentId": deployment_id},
                auth=CAMUNDA_AUTH
            ).json()

            deleted_count = 0

            for pd in pds:
                res = requests.post(
                    f"{CAMUNDA_BASE_URL}/process-instance/delete",
                    json={
                        "processDefinitionId": pd["id"],
                        "deleteReason": f"Cleanup for deployment {deployment_id}",
                        "skipCustomListeners": True,
                        "skipSubprocesses": True,
                        "failIfNotExists": False
                    },
                    auth=CAMUNDA_AUTH
                )
                if res.status_code in (200, 204):
                    deleted_count += res.json().get("count", 0) if res.content else 0

            return jsonify({
                "success": True,
                "deployment_id": deployment_id,
                "deleted_count": deleted_count,
                "message": f"Deleted {deleted_count} process instances"
            })

        except Exception as e:
            return jsonify({
                "success": False,
                "message": f"Error deleting instances: {str(e)}"
            }), 500
    
    # 💣 Delete all deployments for the process key
    @app.route("/delete-all-deployments", methods=["POST"])
    def delete_all_deployments():
        process_key = request.json.get("process_key")

        if not process_key:
            return jsonify({"success": False, "message": "Process key is required"}), 400

        try:
            pds = requests.get(
                f"{CAMUNDA_BASE_URL}/process-definition",
                params={"key": process_key},
                auth=CAMUNDA_AUTH
            ).json()

            deployment_ids = {pd["deploymentId"] for pd in pds}
            deleted_count = 0

            for dep_id in deployment_ids:
                res = requests.delete(
                    f"{CAMUNDA_BASE_URL}/deployment/{dep_id}",
                    params={"cascade": "true"},
                    auth=CAMUNDA_AUTH
                )
                if res.status_code in (200, 204):
                    deleted_count += 1

            return jsonify({
                "success": True,
                "process_key": process_key,
                "deleted_count": deleted_count,
                "message": f"Deleted {deleted_count} deployments"
            })

        except Exception as e:
            return jsonify({
                "success": False,
                "message": f"Error deleting deployments: {str(e)}"
            }), 500


    # # -------- PROCESS INSTANCE CLEANUP --------
    # @app.route("/cleanup-instances", methods=["POST"])
    # def cleanup_instances():
    #     process_key = request.form.get("process_key")

    #     requests.post(
    #         f"{CAMUNDA_BASE_URL}/process-instance/delete",
    #         json={
    #             "processDefinitionKey": process_key,
    #             "deleteReason": "Cleanup process instances",
    #             "skipCustomListeners": True,
    #             "skipSubprocesses": True,
    #             "failIfNotExists": False
    #         },
    #         auth=CAMUNDA_AUTH
    #     )

    #     flash("Process instances deleted", "success")
    #     return redirect(url_for("index"))

    # # -------- DEPLOYMENT CLEANUP --------
    # @app.route("/cleanup-deployments", methods=["POST"])
    # def cleanup_deployments():
    #     process_key = request.form.get("process_key")

    #     pds = requests.get(
    #         f"{CAMUNDA_BASE_URL}/process-definition",
    #         params={"key": process_key},
    #         auth=CAMUNDA_AUTH
    #     ).json()

    #     for pd in pds:
    #         requests.delete(
    #             f"{CAMUNDA_BASE_URL}/deployment/{pd['deploymentId']}",
    #             params={"cascade": "true", "skipCustomListeners": "true"}
    #         )

    #     flash("Deployments deleted", "success")
    #     return redirect(url_for("index"))
    
    # def delete_instances_by_deployment(deployment_id):
    #     # 1. Get process definitions for deployment
    #     pds = requests.get(
    #         f"{CAMUNDA_BASE_URL}/process-definition",
    #         params={"deploymentId": deployment_id},
    #         auth=CAMUNDA_AUTH
    #     ).json()

    #     for pd in pds:
    #         pd_id = pd["id"]

    #         # 2. Delete instances for this process definition
    #         res = requests.post(
    #             f"{CAMUNDA_BASE_URL}/process-instance/delete",
    #             json={
    #                 "processDefinitionId": pd_id,
    #                 "deleteReason": f"Cleanup for deployment {deployment_id}",
    #                 "skipCustomListeners": True,
    #                 "skipSubprocesses": True,
    #                 "failIfNotExists": False
    #             },
    #             auth=CAMUNDA_AUTH
    #         )

    #         if res.status_code not in (200, 204):
    #             raise Exception(
    #                 f"Failed to delete instances for {pd_id}: {res.text}"
    #             )

    return app


def main():
    app = create_app()
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "7171")))

if __name__ == "__main__":
    main()
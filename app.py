from flask import Flask, render_template, request, redirect, url_for, flash
import requests

app = Flask(__name__)
app.secret_key = "super-secret-key"

CAMUNDA_BASE_URL = "http://localhost:8080/engine-rest"


def camunda_get(path, params=None):
    return requests.get(f"{CAMUNDA_BASE_URL}{path}", params=params)


def camunda_post(path, json=None):
    return requests.post(f"{CAMUNDA_BASE_URL}{path}", json=json)


def camunda_delete(path, params=None):
    return requests.delete(f"{CAMUNDA_BASE_URL}{path}", params=params)


@app.route("/", methods=["GET", "POST"])
def index():
    process_key = None
    instances = []
    deployments = []

    if request.method == "POST":
        process_key = request.form.get("process_key")

        # 1. Get process definition
        pd_res = camunda_get(
            "/process-definition",
            params={"key": process_key}
        )

        if pd_res.status_code != 200 or not pd_res.json():
            flash("No process definition found", "error")
            return render_template("index.html")

        process_definitions = pd_res.json()

        # 2. Get process instances
        pi_res = camunda_get(
            "/process-instance",
            params={"processDefinitionKey": process_key}
        )
        instances = pi_res.json()

        # 3. Get deployments
        for pd in process_definitions:
            dep_id = pd.get("deploymentId")
            deployments.append(dep_id)

    return render_template(
        "index.html",
        process_key=process_key,
        instances=instances,
        deployments=set(deployments)
    )


@app.route("/cleanup", methods=["POST"])
def cleanup():
    process_key = request.form.get("process_key")

    # Delete runtime + history instances
    delete_payload = {
        "processDefinitionKey": process_key,
        "deleteReason": "Cleanup via Flask UI",
        "skipCustomListeners": True,
        "skipSubprocesses": True,
        "failIfNotExists": False
    }

    res = camunda_post("/process-instance/delete", json=delete_payload)

    if res.status_code not in (200, 204):
        flash("Failed to delete process instances", "error")
        return redirect(url_for("index"))

    # Fetch process definitions again to delete deployments
    pd_res = camunda_get("/process-definition", params={"key": process_key})

    for pd in pd_res.json():
        deployment_id = pd["deploymentId"]
        camunda_delete(
            f"/deployment/{deployment_id}",
            params={"cascade": "true", "skipCustomListeners": "true"}
        )

    flash("Cleanup completed successfully", "success")
    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(debug=True)
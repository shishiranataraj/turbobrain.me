from flask import Blueprint, request, jsonify
from models import db, Project
from routes.auth import login_required

projects_bp = Blueprint("projects", __name__, url_prefix="/api/projects")


@projects_bp.route("", methods=["GET"])
def list_projects():
    projects = Project.query.order_by(Project.order).all()
    return jsonify([p.to_dict() for p in projects])


@projects_bp.route("", methods=["POST"])
@login_required
def create_project():
    data = request.get_json()
    if not data or not data.get("title"):
        return jsonify({"error": "Title required"}), 400

    project = Project(
        title=data["title"],
        description=data.get("description", ""),
        url=data.get("url", ""),
        tags=data.get("tags", ""),
        order=data.get("order", 0),
    )
    db.session.add(project)
    db.session.commit()
    return jsonify(project.to_dict()), 201


@projects_bp.route("/<int:project_id>", methods=["PUT"])
@login_required
def update_project(project_id):
    project = Project.query.get_or_404(project_id)
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    if "title" in data:
        project.title = data["title"]
    if "description" in data:
        project.description = data["description"]
    if "url" in data:
        project.url = data["url"]
    if "tags" in data:
        project.tags = data["tags"]
    if "order" in data:
        project.order = data["order"]

    db.session.commit()
    return jsonify(project.to_dict())


@projects_bp.route("/<int:project_id>", methods=["DELETE"])
@login_required
def delete_project(project_id):
    project = Project.query.get_or_404(project_id)
    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Deleted"})

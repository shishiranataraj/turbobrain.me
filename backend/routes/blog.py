from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, session
from models import db, Post, slugify
from routes.auth import login_required

blog_bp = Blueprint("blog", __name__, url_prefix="/api/posts")


@blog_bp.route("", methods=["GET"])
def list_posts():
    # Authenticated users see all posts; everyone else sees only published
    if session.get("authenticated"):
        posts = Post.query.order_by(Post.created_at.desc()).all()
    else:
        posts = Post.query.filter_by(published=True).order_by(Post.created_at.desc()).all()
    return jsonify([p.to_dict() for p in posts])


@blog_bp.route("/<slug>", methods=["GET"])
def get_post(slug):
    post = Post.query.filter_by(slug=slug).first_or_404()
    if not post.published and not session.get("authenticated"):
        return jsonify({"error": "Not found"}), 404
    return jsonify(post.to_dict(include_content=True))


@blog_bp.route("", methods=["POST"])
@login_required
def create_post():
    data = request.get_json()
    if not data or not data.get("title"):
        return jsonify({"error": "Title required"}), 400

    slug = slugify(data["title"])
    # Ensure unique slug
    existing = Post.query.filter_by(slug=slug).first()
    if existing:
        slug = f"{slug}-{int(datetime.now(timezone.utc).timestamp())}"

    post = Post(
        title=data["title"],
        slug=slug,
        content=data.get("content", ""),
        summary=data.get("summary", ""),
        published=data.get("published", False),
    )
    db.session.add(post)
    db.session.commit()
    return jsonify(post.to_dict(include_content=True)), 201


@blog_bp.route("/<slug>", methods=["PUT"])
@login_required
def update_post(slug):
    post = Post.query.filter_by(slug=slug).first_or_404()
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    if "title" in data:
        post.title = data["title"]
    if "content" in data:
        post.content = data["content"]
    if "summary" in data:
        post.summary = data["summary"]
    if "published" in data:
        post.published = data["published"]

    post.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(post.to_dict(include_content=True))


@blog_bp.route("/<slug>", methods=["DELETE"])
@login_required
def delete_post(slug):
    post = Post.query.filter_by(slug=slug).first_or_404()
    db.session.delete(post)
    db.session.commit()
    return jsonify({"message": "Deleted"})

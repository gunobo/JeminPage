from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.utils import require_auth
from .models import Project
from .schemas import ProjectCreate, ProjectUpdate, ProjectOut, ProjectOrder

router = APIRouter(prefix="/projects", tags=["projects"])


def ordered(query):
    # sort_order ASC NULLS LAST, created_at ASC (DB 종류와 무관하게 IS NULL 정렬로 표현)
    return query.order_by(Project.sort_order.is_(None), Project.sort_order.asc(), Project.created_at.asc(), Project.id.asc())


@router.get("", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    return ordered(db.query(Project)).all()


# /{project_id} 보다 먼저 선언해야 "order"가 id로 매칭되지 않는다
@router.put("/order", dependencies=[Depends(require_auth)])
def reorder_projects(body: ProjectOrder, db: Session = Depends(get_db)):
    projects = {p.id: p for p in db.query(Project).filter(Project.id.in_(body.ids)).all()}
    if len(projects) != len(set(body.ids)):
        raise HTTPException(status_code=400, detail="존재하지 않는 프로젝트가 포함되어 있습니다")
    for idx, pid in enumerate(body.ids):
        projects[pid].sort_order = idx
    db.commit()
    return {"ok": True}


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Not found")
    return project


@router.post("", response_model=ProjectOut)
def create_project(data: ProjectCreate, db: Session = Depends(get_db), _=Depends(require_auth)):
    project = Project(**data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db), _=Depends(require_auth)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Not found")
    # 요청에 포함된 필드만 갱신 — sort_order처럼 폼에서 안 보내는 값이 NULL로 덮이지 않게
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(project, k, v)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), _=Depends(require_auth)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(project)
    db.commit()
    return {"ok": True}

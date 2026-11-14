# SQLAlchemy가 모든 모델을 알도록 한곳에서 import (main.py, alembic env.py 공용)
from .projects import models as _projects  # noqa: F401
from .contact import models as _contact  # noqa: F401
from .profile import models as _profile  # noqa: F401
from .blog import models as _blog  # noqa: F401
from .stats import models as _stats  # noqa: F401
from .organizations import models as _orgs  # noqa: F401
from .certifications import models as _certs  # noqa: F401
from .velog import models as _velog  # noqa: F401
from .awards import models as _awards  # noqa: F401

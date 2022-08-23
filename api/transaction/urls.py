from rest_framework import routers

from .views import TransactionViewSet

router = routers.DefaultRouter()
router.register(r'transaction', TransactionViewSet)
urlpatterns = router.urls
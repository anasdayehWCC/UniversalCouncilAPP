from common.services.queue_services.azure_service_bus import AzureServiceBusQueueService
from common.services.queue_services.base import QueueService
from common.services.queue_services.sqs import SQSQueueService


class NoopQueueService:
    """In-memory no-op queue used for local/tests to avoid external dependencies."""

    name = "noop"

    def __init__(self, queue_name: str, deadletter_queue_name: str, **kwargs):  # noqa: ARG002
        self.queue_name = queue_name
        self.deadletter_queue_name = deadletter_queue_name

    def receive_message(self, max_messages: int = 10):  # noqa: ARG002
        return []

    def publish_message(self, message):  # noqa: ARG002
        return None

    def complete_message(self, receipt_handle):  # noqa: ARG002
        return None

    def deadletter_message(self, message, receipt_handle):  # noqa: ARG002
        return None

    def abandon_message(self, receipt_handle):  # noqa: ARG002
        return None

    def purge_messages(self):
        return None

queue_services: dict[str, type[QueueService] | QueueService] = {
    SQSQueueService.name: SQSQueueService,
    AzureServiceBusQueueService.name: AzureServiceBusQueueService,
    NoopQueueService.name: NoopQueueService,
}


def get_queue_service(queue_service_name: str, queue_name: str, deadletter_queue_name: str) -> QueueService:
    service = queue_services.get(queue_service_name)
    if not service:
        msg = f"Invalid storage service name: {queue_service_name}"
        raise ValueError(msg)
    if isinstance(service, type):
        return service(queue_name, deadletter_queue_name)
    return service

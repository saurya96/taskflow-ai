import unittest
from bson import ObjectId

from taskflow_worker.worker import perform_operation, process_task


class FakeTasks:
    def __init__(self, task):
        self.task = task
        self.updates = []

    def find_one(self, query):
        return self.task if query["_id"] == self.task["_id"] else None

    def update_one(self, query, update):
        self.updates.append(update)
        if "$set" in update:
            self.task.update(update["$set"])
        if "$push" in update:
            self.task.setdefault("logs", []).append(update["$push"]["logs"])


class WorkerOperationTests(unittest.TestCase):
    def test_supported_operations(self):
        self.assertEqual(perform_operation("uppercase", "Hi there"), "HI THERE")
        self.assertEqual(perform_operation("lowercase", "Hi THERE"), "hi there")
        self.assertEqual(perform_operation("reverse", "abc"), "cba")
        self.assertEqual(perform_operation("word_count", "one  two\nthree"), "3")

    def test_unsupported_operation_raises(self):
        with self.assertRaises(ValueError):
            perform_operation("invalid", "text")

    def test_task_is_persisted_as_success(self):
        task = {
            "_id": ObjectId("507f1f77bcf86cd799439011"),
            "inputText": "hello",
            "operation": "uppercase",
            "status": "pending"
        }
        collection = FakeTasks(task)

        processed = process_task({"taskId": str(task["_id"])}, collection)

        self.assertTrue(processed)
        self.assertEqual(task["status"], "success")
        self.assertEqual(task["result"], "HELLO")
        self.assertEqual(len(task["logs"]), 2)
        self.assertIn("INFO", task["logs"][0])
        self.assertIn("INFO", task["logs"][1])

    def test_processing_error_persists_failed_status(self):
        task = {
            "_id": ObjectId("507f1f77bcf86cd799439011"),
            "inputText": "hello",
            "operation": "invalid",
            "status": "pending"
        }
        collection = FakeTasks(task)

        processed = process_task({"taskId": str(task["_id"])}, collection)

        self.assertTrue(processed)
        self.assertEqual(task["status"], "failed")
        self.assertIn("ERROR", task["logs"][-1])


if __name__ == "__main__":
    unittest.main()

import argparse
import json
import os
import signal
import time
from datetime import datetime, timezone
from pathlib import Path
from threading import Event

import redis
from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient


ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

QUEUE_NAME = "task-processing"
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")
MONGO_URI = os.getenv("MONGO_URI")
shutdown_event = Event()


def perform_operation(operation, input_text):
    if operation == "uppercase":
        return input_text.upper()
    if operation == "lowercase":
        return input_text.lower()
    if operation == "reverse":
        return input_text[::-1]
    if operation == "word_count":
        return str(len(input_text.split()))
    raise ValueError("Unsupported operation")


def _log_entry(severity, message):
    timestamp = datetime.now(timezone.utc).isoformat()
    return f"{timestamp} {severity} {message}"


def process_task(task_data, tasks):
    if not isinstance(task_data, dict) or not isinstance(task_data.get("taskId"), str):
        print("Rejected malformed task message")
        return False

    try:
        task_id = ObjectId(task_data["taskId"])
    except Exception:
        print("Rejected task message with invalid task ID")
        return False

    task = tasks.find_one({"_id": task_id})
    if task is None:
        print(f"Task not found: {task_id}")
        return False

    if task.get("status") in {"success", "failed"}:
        print(f"Skipping already completed task: {task_id}")
        return True

    tasks.update_one(
        {"_id": task_id},
        {
            "$set": {"status": "running"},
            "$push": {"logs": _log_entry("INFO", "Task processing started")}
        }
    )

    try:
        input_text = task.get("inputText")
        if not isinstance(input_text, str):
            raise ValueError("Task inputText must be a string")
        result = perform_operation(task.get("operation"), input_text)
    except Exception as error:
        tasks.update_one(
            {"_id": task_id},
            {
                "$set": {"status": "failed"},
                "$push": {
                    "logs": _log_entry("ERROR", f"Task processing failed ({type(error).__name__})")
                }
            }
        )
        print(f"Task failed: {task_id} ({type(error).__name__})")
        return True

    tasks.update_one(
        {"_id": task_id},
        {
            "$set": {
                "result": result,
                "status": "success"
            },
            "$push": {
                "logs": _log_entry("INFO", "Task completed successfully")
            }
        }
    )
    print(f"Task completed: {task_id}")
    return True


def _handle_shutdown(_signum, _frame):
    shutdown_event.set()


def run_worker(max_jobs=None):
    if not MONGO_URI:
        raise RuntimeError("MONGO_URI is not configured")

    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        password=REDIS_PASSWORD,
        decode_responses=True,
        socket_connect_timeout=5
    )
    mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=30000)
    jobs_handled = 0

    try:
        redis_client.ping()
        mongo_client.admin.command("ping")
        tasks = mongo_client["taskflow_ai"]["tasks"]
        print(f"Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
        print("Connected to MongoDB")
        print("Python worker started; waiting for tasks")

        while not shutdown_event.is_set():
            try:
                job = redis_client.brpop(QUEUE_NAME, timeout=5)
            except redis.exceptions.RedisError as error:
                print(f"Redis unavailable; retrying ({type(error).__name__})")
                shutdown_event.wait(1)
                continue

            if not job:
                continue

            try:
                task_data = json.loads(job[1])
                handled = process_task(task_data, tasks)
                if not handled:
                    print("Task message could not be matched to a task record")
            except json.JSONDecodeError:
                print("Rejected malformed JSON task message")
            except Exception as error:
                redis_client.lpush(QUEUE_NAME, job[1])
                print(
                    "Task processing encountered a service error; "
                    f"message returned to queue ({type(error).__name__})"
                )
                time.sleep(1)

            jobs_handled += 1
            if max_jobs is not None and jobs_handled >= max_jobs:
                break
    finally:
        redis_client.close()
        mongo_client.close()


def main():
    parser = argparse.ArgumentParser(description="Process tasks from Redis")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Handle at most one queue message and exit"
    )
    args = parser.parse_args()

    signal.signal(signal.SIGINT, _handle_shutdown)
    signal.signal(signal.SIGTERM, _handle_shutdown)
    run_worker(max_jobs=1 if args.once else None)


if __name__ == "__main__":
    main()

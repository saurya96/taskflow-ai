jest.mock("../../src/models/Task");
jest.mock("../../src/models/Project");
jest.mock("../../src/services/taskQueue", () => jest.fn());

const Task = require("../../src/models/Task");
const Project = require("../../src/models/Project");
const taskQueue = require("../../src/services/taskQueue");
const { createTask } = require("../../src/controllers/taskController");

const projectId = "507f1f77bcf86cd799439011";
const taskId = "507f1f77bcf86cd799439012";

const makeResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

describe("createTask", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Project.findOne.mockResolvedValue({ _id: projectId });
    Task.create.mockResolvedValue({
      _id: { toString: () => taskId }
    });
    taskQueue.mockResolvedValue(undefined);
  });

  it("validates required task fields before database access", async () => {
    const res = makeResponse();

    await createTask(
      { body: { title: " ", projectId, inputText: "", operation: "uppercase" }, user: "user-1" },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Project.findOne).not.toHaveBeenCalled();
    expect(Task.create).not.toHaveBeenCalled();
  });

  it("rejects unsupported operations", async () => {
    const res = makeResponse();

    await createTask(
      { body: { title: "Task", projectId, inputText: "text", operation: "delete" }, user: "user-1" },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Task.create).not.toHaveBeenCalled();
  });

  it.each(["uppercase", "lowercase", "reverse", "word_count"])(
    "creates and enqueues a pending %s task",
    async (operation) => {
      const res = makeResponse();

      await createTask(
        {
          body: { title: "  Example  ", projectId, inputText: "hello world", operation },
          user: "user-1"
        },
        res
      );

      expect(Project.findOne).toHaveBeenCalledWith({ _id: projectId, ownerId: "user-1" });
      expect(Task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Example",
          projectId,
          createdBy: "user-1",
          inputText: "hello world",
          operation,
          status: "pending"
        })
      );
      expect(taskQueue).toHaveBeenCalledWith(taskId);
      expect(res.status).toHaveBeenCalledWith(201);
    }
  );

  it("does not create a task for a project owned by another user", async () => {
    Project.findOne.mockResolvedValue(null);
    const res = makeResponse();

    await createTask(
      { body: { title: "Task", projectId, inputText: "text", operation: "uppercase" }, user: "user-1" },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(Task.create).not.toHaveBeenCalled();
    expect(taskQueue).not.toHaveBeenCalled();
  });

  it("reports queue failure without exposing the underlying error", async () => {
    taskQueue.mockRejectedValue(new Error("Redis connection failed"));
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = makeResponse();

    await createTask(
      { body: { title: "Task", projectId, inputText: "text", operation: "uppercase" }, user: "user-1" },
      res
    );

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Task was created but could not be added to the queue",
        taskId
      })
    );
    expect(consoleError).toHaveBeenCalledWith(
      "Task was created but could not be queued:",
      "Error"
    );
    consoleError.mockRestore();
  });
});

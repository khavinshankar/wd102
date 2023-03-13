const request = require("supertest");
const cheerio = require("cheerio");

const db = require("../models/index");
const app = require("../app");

let server, agent;

const getCsrfToken = async () => {
  const response = await agent.get("/");
  const $ = cheerio.load(response.text);
  return $("meta[name=csrf]").attr("content");
};

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
    console.log("csrf", await getCsrfToken());
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: await getCsrfToken(),
    });
    expect(response.statusCode).toBe(302);
  });

  test("Marks a todo with the given ID as complete and unmarks it", async () => {
    const initialLength = JSON.parse(
      (await agent.get("/").set("Accept", "application/json"))?.text
    )?.todos?.length;

    const title = "Buy milk";
    await agent.post("/todos").send({
      title,
      dueDate: new Date().toISOString(),
      _csrf: await getCsrfToken(),
    });

    const todos = JSON.parse(
      (await agent.get("/").set("Accept", "application/json"))?.text
    )?.todos;
    const latestTodo = todos?.[todos.length - 1];

    expect(todos?.length).toBe(initialLength + 1);
    expect(latestTodo?.title).toBe(title);
    expect(latestTodo?.completed).toBe(false);

    const markCompleteResponse = await agent
      .put(`/todos/${latestTodo?.id}`)
      .send({ _csrf: await getCsrfToken(), completed: true });
    const parsedMarkCompleteResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedMarkCompleteResponse.completed).toBe(true);

    const unmarkCompleteResponse = await agent
      .put(`/todos/${latestTodo?.id}`)
      .send({ _csrf: await getCsrfToken(), completed: false });
    const parsedUnMarkCompleteResponse = JSON.parse(
      unmarkCompleteResponse.text
    );
    expect(parsedUnMarkCompleteResponse.completed).toBe(false);
  });

  test("Fetches all todos in the database using /todos endpoint", async () => {
    const initialLength = JSON.parse(
      (await agent.get("/").set("Accept", "application/json"))?.text
    )?.todos?.length;

    const title1 = "Buy xbox";
    const title2 = "Buy ps3";
    await agent.post("/todos").send({
      title: title1,
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: await getCsrfToken(),
    });
    await agent.post("/todos").send({
      title: title2,
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: await getCsrfToken(),
    });

    const todos = JSON.parse(
      (await agent.get("/").set("Accept", "application/json"))?.text
    )?.todos;

    expect(todos?.length).toBe(initialLength + 2);
    expect(todos?.[todos.length - 2]?.title).toBe(title1);
    expect(todos?.[todos.length - 1]?.title).toBe(title2);
  });

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    const initialLength = JSON.parse(
      (await agent.get("/").set("Accept", "application/json"))?.text
    )?.todos?.length;

    const title = "Buy milk";
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: await getCsrfToken(),
    });

    const todos = JSON.parse(
      (await agent.get("/").set("Accept", "application/json"))?.text
    )?.todos;
    const latestTodo = todos?.[todos.length - 1];

    expect(todos?.length).toBe(initialLength + 1);
    expect(latestTodo?.title).toBe(title);

    const deleteResponse = await agent
      .delete(`/todos/${latestTodo?.id}`)
      .send({ _csrf: await getCsrfToken() });
    expect(deleteResponse.text).toBe("true");
  });
});

const request = require("supertest");
const cheerio = require("cheerio");

const db = require("../models/index");
const app = require("../app");

let server, agent;

const username = "mail@khavinshankar.dev";
const password = "password";

const getCsrfToken = async (agent, page = "/todos") => {
  const response = await agent.get(page);
  const $ = cheerio.load(response.text);
  return $("meta[name=csrf]").attr("content");
};

const login = async (agent, username, password) => {
  const csrfToken = await getCsrfToken(agent, "/login");
  const response = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });

  console.log(
    "\n------------------------------------------\n",
    csrfToken,
    response.statusCode,
    "\n------------------------------------------\n"
  );
};

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
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

  test("Signs up a new user", async () => {
    const csrfToken = await getCsrfToken(agent, "/signup");
    const response = await agent.post("/users").send({
      firstName: "Khavin",
      lastName: "Shankar",
      email: username,
      password: password,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Signs the user out", async () => {
    const todosReponseBeforeSignout = await agent.get("/todos");
    expect(todosReponseBeforeSignout.statusCode).toBe(200);
    const signoutResponse = await agent.get("/signout");
    expect(signoutResponse.statusCode).toBe(302);
    const todosReponseAfterSignout = await agent.get("/todos");
    expect(todosReponseAfterSignout.statusCode).toBe(302);
  });

  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
    const agent = request.agent(server);
    await login(agent, username, password);

    const csrfToken = await getCsrfToken(agent);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Marks a todo with the given ID as complete and unmarks it", async () => {
    const agent = request.agent(server);
    await login(agent, username, password);

    const initialLength = JSON.parse(
      (await agent.get("/todos").set("Accept", "application/json"))?.text
    )?.todos?.length;

    const title = "Buy milk";
    const csrfToken = await getCsrfToken(agent);
    await agent.post("/todos").send({
      title,
      dueDate: new Date().toISOString(),
      _csrf: csrfToken,
    });

    const todos = JSON.parse(
      (await agent.get("/todos").set("Accept", "application/json"))?.text
    )?.todos;
    const latestTodo = todos?.[todos.length - 1];

    expect(todos?.length).toBe(initialLength + 1);
    expect(latestTodo?.title).toBe(title);
    expect(latestTodo?.completed).toBe(false);

    const csrfToken1 = await getCsrfToken(agent);
    const markCompleteResponse = await agent
      .put(`/todos/${latestTodo?.id}`)
      .send({ _csrf: csrfToken1, completed: true });
    const parsedMarkCompleteResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedMarkCompleteResponse.completed).toBe(true);

    const csrfToken2 = await getCsrfToken(agent);
    const unmarkCompleteResponse = await agent
      .put(`/todos/${latestTodo?.id}`)
      .send({ _csrf: csrfToken2, completed: false });
    const parsedUnMarkCompleteResponse = JSON.parse(
      unmarkCompleteResponse.text
    );
    expect(parsedUnMarkCompleteResponse.completed).toBe(false);
  });

  test("Fetches all todos in the database using /todos endpoint", async () => {
    const agent = request.agent(server);
    await login(agent, username, password);

    const initialLength = JSON.parse(
      (await agent.get("/todos").set("Accept", "application/json"))?.text
    )?.todos?.length;

    const title1 = "Buy xbox";
    const title2 = "Buy ps3";
    const csrfToken1 = await getCsrfToken(agent);
    await agent.post("/todos").send({
      title: title1,
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken1,
    });
    const csrfToken2 = await getCsrfToken(agent);
    await agent.post("/todos").send({
      title: title2,
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken2,
    });

    const todos = JSON.parse(
      (await agent.get("/todos").set("Accept", "application/json"))?.text
    )?.todos;

    expect(todos?.length).toBe(initialLength + 2);
    expect(todos?.[todos.length - 2]?.title).toBe(title1);
    expect(todos?.[todos.length - 1]?.title).toBe(title2);
  });

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    const agent = request.agent(server);
    await login(agent, username, password);

    const initialLength = JSON.parse(
      (await agent.get("/todos").set("Accept", "application/json"))?.text
    )?.todos?.length;

    const title = "Buy milk";
    const csrfToken1 = await getCsrfToken(agent);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken1,
    });

    const todos = JSON.parse(
      (await agent.get("/todos").set("Accept", "application/json"))?.text
    )?.todos;
    const latestTodo = todos?.[todos.length - 1];

    expect(todos?.length).toBe(initialLength + 1);
    expect(latestTodo?.title).toBe(title);

    const csrfToken2 = await getCsrfToken(agent);
    const deleteResponse = await agent
      .delete(`/todos/${latestTodo?.id}`)
      .send({ _csrf: csrfToken2 });
    expect(deleteResponse.text).toBe("true");
  });
});

const path = require("path");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_PARSER_SECRET || ""));
app.use(csrf({ cookie: true }));

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", async function (request, response) {
  const todos = await Todo.getTodos();
  const overdueTodos = await Todo.overdue();
  const dueTodayTodos = await Todo.dueToday();
  const dueLaterTodos = await Todo.dueLater();
  const completedTodos = await Todo.completed();
  if (request.accepts("html")) {
    response.render("index", {
      todos,
      overdueTodos,
      dueLaterTodos,
      dueTodayTodos,
      completedTodos,
      _csrf: request.csrfToken(),
    });
  } else {
    response.json({ todos });
  }
});

app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");

  try {
    const todos = await Todo.findAll();
    return response.json(todos);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  try {
    await Todo.addTodo(request.body);
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.setCompletionStatus(request.body?.completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);

  const todo = await Todo.findByPk(request.params.id);
  if (!todo) return response.json(false);
  try {
    const _ = await todo.delete();
    return response.json(true);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

module.exports = app;

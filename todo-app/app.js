const path = require("path");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const express = require("express");
const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const connectEnsureLogin = require("connect-ensure-login");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");

const saltRounds = 10;
const app = express();

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_PARSER_SECRET || ""));
app.use(csrf({ cookie: true }));

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.set("views", path.join(__dirname, "views"));
app.use(flash());

const DAY_IN_MS = 24 * 60 * 60 * 1000;
app.use(
  session({
    secret: "hcwrvwvywbvywv8wyv8w",
    cookie: {
      maxAge: DAY_IN_MS,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch)
            return done(null, false, { message: "Invalid password" });

          return done(null, user);
        })
        .catch((error) => done(error, null));
    }
  )
);
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => done(null, user))
    .catch((error) => done(error, null));
});

app.get("/", (request, response) => {
  response.render("index");
});

app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const userId = request.user?.id;
    const todos = await Todo.getTodos(userId);
    const overdueTodos = await Todo.overdue(userId);
    const dueTodayTodos = await Todo.dueToday(userId);
    const dueLaterTodos = await Todo.dueLater(userId);
    const completedTodos = await Todo.completed(userId);
    if (request.accepts("html")) {
      response.render("todos", {
        todos,
        overdueTodos,
        dueLaterTodos,
        dueTodayTodos,
        completedTodos,
        _csrf: request.csrfToken(),
        user: request.user,
        messages: request.flash(),
      });
    } else {
      response.json({ todos });
    }
  }
);

app.get("/signup", (request, response) => {
  response.render("signup", {
    messages: request.flash(),
    _csrf: request.csrfToken(),
  });
});

app.post("/users", async (request, response) => {
  const { firstName, lastName, email, password } = request.body;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  try {
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    request.login(user, (error) => {
      if (error) {
        return console.error(error);
      }

      response.redirect("/todos");
    });
  } catch (err) {
    console.log(err);
    if (err.name === "SequelizeValidationError") {
      request.flash(
        "error",
        err.errors.map((error) => error.message)
      );
      return response.redirect("/signup");
    }
  }
});

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.get(["/login", "/signin"], (request, response) => {
  response.render("login", { _csrf: request.csrfToken() });
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    response.redirect("/todos");
  }
);

app.get(["/logout", "/signout"], (request, response, next) => {
  request.logout((error) => {
    if (error) return next(error);

    response.redirect("/");
  });
});

app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (_request, response) {
    console.log("Processing list of all Todos ...");

    try {
      const todos = await Todo.findAll();
      return response.json(todos);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      const todo = await Todo.findByPk(request.params.id);
      return response.json(todo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      await Todo.addTodo({ ...request.body, userId: request.user?.id });
      request.flash("success", "Successfully added a todo.");
      return response.redirect("/todos");
    } catch (err) {
      if (err.name === "SequelizeValidationError") {
        request.flash(
          "error",
          err.errors.map((error) => error.message)
        );
        return response.redirect("/todos");
      }

      return response.status(422).json(err);
    }
  }
);

app.put(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      const updatedTodo = await Todo.setTodoCompletionStatus(
        request.params.id,
        request.body?.completed,
        request.user?.id
      );
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      const status = await Todo.removeTodo(request.params.id, request.user?.id);
      return response.json(!!status);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

module.exports = app;

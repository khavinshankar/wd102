const { all, add, markAsComplete, overdue, dueToday, dueLater } =
  require("../todo")();

const formatDate = (date) => new Date(date).toISOString().slice(0, 10);
const todayDate = new Date();
const today = formatDate(todayDate);
const yesterday = formatDate(new Date().setDate(todayDate.getDate() - 1));
const tomorrow = formatDate(new Date().setDate(todayDate.getDate() + 1));

const overdueTodos = [
  { title: "Submit assignment", dueDate: yesterday, completed: false },
];
const dueTodayTodos = [
  { title: "Pay rent", dueDate: today, completed: true },
  { title: "Service Vehicle", dueDate: today, completed: false },
];
const dueLaterTodos = [
  { title: "File taxes", dueDate: tomorrow, completed: false },
  { title: "Pay electric bill", dueDate: tomorrow, completed: false },
];
const seedData = [...overdueTodos, ...dueTodayTodos, ...dueLaterTodos];

describe("TodoList Test Suite", () => {
  beforeEach(() => {
    all.splice(0);
    seedData.forEach(add);
  });

  test("should add a new todo", () => {
    const initialTodosCount = all.length;
    const todo = {
      title: "Renew Netflix subscription",
      dueDate: tomorrow,
      completed: false,
    };
    add(todo);
    expect(all.length).toBe(initialTodosCount + 1);
    expect(all).toEqual(
      expect.arrayContaining([expect.objectContaining(todo)])
    );
  });

  test("should mark a todo as completed", () => {
    const todoIndex = 0;
    expect(all[todoIndex].completed).toBe(false);
    markAsComplete(todoIndex);
    expect(all[todoIndex].completed).toBe(true);
  });

  test("should retrieve overdue todos", () => {
    const overdueTodosRetrieved = overdue();
    expect(overdueTodosRetrieved.length).toBe(overdueTodos.length);
    expect(overdueTodosRetrieved).toEqual(
      expect.arrayContaining(overdueTodos.map(expect.objectContaining))
    );
  });

  test("should retrieve due today todos", () => {
    const dueTodayTodosRetrieved = dueToday();
    expect(dueTodayTodosRetrieved.length).toBe(dueTodayTodos.length);
    expect(dueTodayTodosRetrieved).toEqual(
      expect.arrayContaining(dueTodayTodos.map(expect.objectContaining))
    );
  });

  test("should retrieve due later todos", () => {
    const dueLaterTodosRetrieved = dueLater();
    expect(dueLaterTodosRetrieved.length).toBe(dueLaterTodos.length);
    expect(dueLaterTodosRetrieved).toEqual(
      expect.arrayContaining(dueLaterTodos.map(expect.objectContaining))
    );
  });
});

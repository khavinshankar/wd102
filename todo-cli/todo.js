const todoList = () => {
  const all = [];

  const add = (todoItem) => {
    all.push(todoItem);
  };

  const markAsComplete = (index) => {
    all[index].completed = true;
  };

  const formattedDate = (d) => {
    return d.toISOString().split("T")[0];
  };

  const overdue = () => {
    return all.filter(
      (todo) => new Date(todo.dueDate) < new Date(formattedDate(new Date()))
    );
  };

  const dueToday = () => {
    return all.filter((todo) => todo.dueDate === formattedDate(new Date()));
  };

  const dueLater = () => {
    return all.filter((todo) => new Date(todo.dueDate) > new Date());
  };

  const toDisplayableList = (list) => {
    return list
      .map(
        (todo) =>
          `[${todo.completed ? "x" : " "}] ${todo.title} ${
            todo.dueDate === formattedDate(new Date()) ? "" : todo.dueDate
          }`
      )
      .join("\n");
  };

  return {
    all,
    add,
    markAsComplete,
    overdue,
    dueToday,
    dueLater,
    toDisplayableList,
  };
};

module.exports = todoList;

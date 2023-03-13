"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static getTodos() {
      return this.findAll();
    }

    static async overdue(completed) {
      return await Todo.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date(),
          },
          completed: {
            [Op.or]: completed ? [true, false] : [false],
          },
        },
      });
    }

    static async dueToday(completed) {
      return await Todo.findAll({
        where: {
          dueDate: {
            [Op.eq]: new Date(),
          },
          completed: {
            [Op.or]: completed ? [true, false] : [false],
          },
        },
      });
    }

    static async dueLater(completed) {
      return await Todo.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date(),
          },
          completed: {
            [Op.or]: completed ? [true, false] : [false],
          },
        },
      });
    }

    static async completed() {
      return await Todo.findAll({
        where: {
          completed: {
            [Op.eq]: true,
          },
        },
      });
    }

    static addTodo({ title, dueDate }) {
      return this.create({ title, dueDate, completed: false });
    }

    setCompletionStatus(completed) {
      return this.update({ completed });
    }

    delete() {
      return this.destroy();
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};

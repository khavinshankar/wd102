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
      Todo.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }

    static getTodos(userId) {
      return this.findAll({ where: { userId } });
    }

    static async overdue(userId, completed) {
      return await Todo.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date(),
          },
          userId,
          completed: {
            [Op.or]: completed ? [true, false] : [false],
          },
        },
      });
    }

    static async dueToday(userId, completed) {
      return await Todo.findAll({
        where: {
          dueDate: {
            [Op.eq]: new Date(),
          },
          userId,
          completed: {
            [Op.or]: completed ? [true, false] : [false],
          },
        },
      });
    }

    static async dueLater(userId, completed) {
      return await Todo.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date(),
          },
          userId,
          completed: {
            [Op.or]: completed ? [true, false] : [false],
          },
        },
      });
    }

    static async completed(userId) {
      return await Todo.findAll({
        where: {
          completed: {
            [Op.eq]: true,
          },
          userId,
        },
      });
    }

    static addTodo({ title, dueDate, userId }) {
      return this.create({ title, dueDate, completed: false, userId });
    }

    static removeTodo(id, userId) {
      return this.destroy({ where: { id, userId } });
    }

    static async setTodoCompletionStatus(id, completed, userId) {
      return (
        await this.update(
          { completed },
          { where: { id, userId }, returning: true }
        )
      )?.[1]?.[0];
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

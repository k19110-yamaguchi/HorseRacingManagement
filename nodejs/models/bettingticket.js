'use strict';
module.exports = (sequelize, DataTypes) => {
  const BettingTicket = sequelize.define('BettingTicket', {
    userId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "ユーザIDは必須です。"
        }
      }
    },
    date: {
      type: DataTypes.DATE,
      validate: {
        notEmpty: {
          msg: "開催日時は必須です。"
        }
      }
    },
    place: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "開催場所は必須です。"
        }
      }
    },
    num: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "第何レースか必須です。"
        }
      }
    },
    kind: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "馬券の買い方は必須です。"
        }
      }
    },
    comb: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "組み合わせ方は必須です。"
        }
      }
    },
    first: {
      type: DataTypes.INTEGER,
    },
    second: {
      type: DataTypes.INTEGER,
    },
    third: {
      type: DataTypes.INTEGER,
    },
    bet: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "賭け金は必須です。"
        }
      }
    },
    refund: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "払い戻しは必須です。"
        }
      }
    }
  }, {});

  BettingTicket.associate = function(models){
    BettingTicket.belongsTo(models.User);

  };
  return BettingTicket;

};
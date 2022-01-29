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
    raceId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "レースIDは必須です。"
        }
      }
    },
    date: {
      type: DataTypes.INTEGER,
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
          msg: "第何Rか必須です。"
        }
      }
    },
    racename: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "レース名は必須です。"
        }
      }
    },
    money: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "賭け金は必須です。"
        }
      }
    },
    kind: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "馬券の式別は必須です。"
        }
      }
    },
    comb: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "馬券の方式は必須です。"
        }
      }
    },    
    elm: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "買い目は必須です。"
        }
      }
    },
    elmLen: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "買い目の長さは必須です。"
        }
      }
    },
    combNum: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "組み合わせ数は必須です。"
        }
      }
    },
  }, {});

  BettingTicket.associate = function(models){
    BettingTicket.belongsTo(models.User);

  };
  return BettingTicket;

};
'use strict';
module.exports = (sequelize, DataTypes) => {
  const Horse = sequelize.define('Horse', {
    betId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "ベットIDは必須です。"
        }
      }
    },
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
    name: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "名前は必須です。"
        }
      }
    },
    date: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "開催日付は必須です。"
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
          msg: "第何レースは必須です。"
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
          msg: "掛け金は必須です。"
        }
      }
    },        
  }, {});

  Horse.associate = function(models){
    Horse.belongsTo(models.User);    

  };
  return Horse;

};
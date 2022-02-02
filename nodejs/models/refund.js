'use strict';
module.exports = (sequelize, DataTypes) => {
  const Refund = sequelize.define('Refund', {
    raceId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "レースIDは必須です。"
        }
      }
    },
    first: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "1着は必須です。"
        }
      }
    },
    second: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "2着は必須です。"
        }
      }
    },
    third: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "3着は必須です。"
        }
      }
    },
    win: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "単勝は必須です。"
        }
      }
    },
    place: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "複勝は必須です。"
        }
      }
    },
    bracket: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "枠連は必須です。"
        }
      }
    },
    quinella: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "馬連は必須です。"
        }
      }
    },
    wid: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "ワイドは必須です。"
        }
      }
    },
    exacta: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "馬単は必須です。"
        }
      }
    },
    trio: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "3連複は必須です。"
        }
      }
    },
    trifecta: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "3連単は必須です。"
        }
      }
    },    
  }, {});

  Refund.associate = function(models){    

  };
  return Refund;

};
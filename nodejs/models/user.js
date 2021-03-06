'use strict';

module.exports = (sequelize, DataTypes) => {
  
  const User = sequelize.define('User', {
    name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "名前は必ず入力してください。"
        }
      }
    },
    pass: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "パスワードは必ず入力してください。"
        }
      }
    }
  }, {});
  User.associate = function(models){
    User.hasMany(models.BettingTicket);  
    User.hasMany(models.Horse);    
    
  };
  return User;
};
本文用来记录ORM模型sequelize的使用过程中的遇到的各种正确的打开方式

##### 查找一条数据进行更新，若未查找到则新建一条数据

```js
// .then()写法
Model.findOrCreate(
  { 
    where: { username: 'wd' } ,
    defaults: { // 未查找到要创建的值
      username: 'wd', 
      age: 18 
    }
  }).then((result) => {
    const [instance, wasCreated] = result;
    if（!wasCreated）{
      instance.update({
        username: 'wd', 
        age: 18 
      })
    }
  }
);

// async await写法
const [instance, wasCreated] = await Model.findOrCreate(
  { 
    where: { username: 'wd' } ,
    defaults: { // 未查找到要创建的值
      username: 'wd', 
      age: 18 
    }
  });
if(!wasCreated) {
  await instance.update({
        username: 'wd', 
        age: 18 
      });
}
```



##### 校验一个字段是否是JSON数据类型

```js
// isJSON的值为1或0，表明是否是JSON类型
Model.findAll({
  attributes: [[sequelize.fn('JSON_VALID', sequelize.col('hobby')), 'isJSON']]
})

// 获取所有 hobby值为JSON类型的数据
Model.findAll({
  where: sequelize.where(
      sequelize.fn('JSON_VALID', sequelize.col('hobby')),
      { [Op.gte]: 1 }
    )
})
```



##### 获取JSON数据中的某一个属性值

```js
Model.findAll({
  attributes: [[sequelize.fn('JSON_EXTRACT', sequelize.col('hobby'), '$.basketball'), 'basketball']]
})
```



##### 查询条件为JSON数据中是否包含某个值

```js
// 查询 hobby中basketball属性为true
Model.findAll({
  where:{
    [Op.and]: [
      sequelize.where(
        sequelize.fn('JSON_VALID', sequelize.col('auditors')),
        '1'
      ),
      sequelize.where(
        sequelize.fn(
          'JSON_CONTAINS', 
           sequelize.col('hobby'), 'true', '$.basketball'),
          { [Op.gte]: 1 })
      )
    ]
  }
});

// 查询 bobby中的id_arr属性(是个数组)中含有676776, 636156
Model.findAll({
  where:{
    [Op.and]: [
      sequelize.where(
        sequelize.fn('JSON_VALID', sequelize.col('auditors')),
        '1'
      ),
      sequelize.where(
      sequelize.fn(
        'JSON_CONTAINS', 
        sequelize.col('hobby'), 
         sequelize.fn('JSON_ARRAY', 676776, 636156), 
         '$.id_arr'),
      { [Op.gte]: 1 }
      )
    ]
  }
})

// 查询 bobby中是否有'$.id_arr', '$.test'中的一个
Model.findAll({
    where:{
      [Op.and]: [
      sequelize.where(
          sequelize.fn('JSON_VALID', sequelize.col('auditors')),
          '1'
        ),
        sequelize.where(
          sequelize.fn('JSON_CONTAINS_PATH', sequelize.col('hobby'), 
                     'one', '$.id_arr', '$.test'),
          { [Op.gte]: 1 }
        )
      ]
    }
})

// 查询 bobby中是否有以下的'$.id_arr', '$.test'属性
Model.findAll({
  where:{
    [Op.and]: [
      sequelize.where(
          sequelize.fn('JSON_VALID', sequelize.col('auditors')),
          '1'
        ),
     sequelize.where(
        sequelize.fn('JSON_CONTAINS_PATH', sequelize.col('hobby'), 
                     'all', '$.id_arr', '$.test'),
        { [Op.gte]: 1 }
        )
    ]
  }
})
```



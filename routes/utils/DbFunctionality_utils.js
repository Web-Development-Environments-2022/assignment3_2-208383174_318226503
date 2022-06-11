const { use } = require("../user");
const DButils = require("./DButils");

async function markAsFavorite(user_id, recipe_id) {
  await DButils.execQuery(
    `insert into FavoriteRecipes values ('${user_id}',${recipe_id})`
  );
}

async function getFavoriteRecipes(user_id) {
  const recipes_id = await DButils.execQuery(
    `select recipe_id from FavoriteRecipes where user_id='${user_id}'`
  );
  return recipes_id;
}

async function getPersonalRecipes(user_id) {
  const recipes_id = await DButils.execQuery(
    `select recipe_id from usersPersonalRecipes where user_id='${user_id}'`
  );
  return recipes_id;
}

async function isRecipeFavorite(user_id, recipe_id) {
  const favoriteRecipe = await DButils.execQuery(
    `select * from FavoriteRecipes where user_id='${user_id}' AND recipe_id='${recipe_id}'`
  );
  return favoriteRecipe.length !== 0;
}

async function isRecipeViewed(user_id, recipe_id) {
  const viewedRecipe = await DButils.execQuery(
    `select * from usersRecipesViews where user_id='${user_id}' AND recipe_id='${recipe_id}'`
  );
  return !(viewedRecipe.length === 0);
}

async function viewRecipe(user_id, recipe_id) {
  let isViewed = await isRecipeViewed(user_id, recipe_id);
  if (isViewed) {
    await DButils.execQuery(
      `DELETE FROM usersRecipesviews where user_id='${user_id}' AND recipe_id='${recipe_id}'`
    );
  }
  await DButils.execQuery(
    `insert into usersrecipesviews values ('${user_id}',${recipe_id})`
  );
}

async function getNewestViewedRecipes(user_id, num_of_recipes) {
  const recipes_id = await DButils.execQuery(
    `SELECT recipe_id FROM usersrecipesviews WHERE user_id = ${user_id} ORDER BY recipe_id DESC
    LIMIT ${num_of_recipes};
    `
  );
  return recipes_id;
}

async function addNewRecipeToDb(
  user_id,
  title,
  image,
  readyInMinutes,
  vegan,
  vegetarian,
  glutenFree,
  servingSize,
  ingredientsAndQuantities,
  instructions
) {
  console.log("adding new recipe to db");
  popularity = 0;
  const newRecipe = await DButils.execQuery(
    `INSERT INTO usersPersonalRecipes (user_id, title, image, readyInMinutes, popularity, vegan, vegetarian, glutenFree, servingSize) VALUES ('${user_id}','${title}','${image}','${readyInMinutes}','${popularity}','${vegan}','${vegetarian}','${glutenFree}', '${servingSize}')`
  );
  console.log("finished adding to userPersonalRecipes");
  let id = newRecipe.insertId;
  await addIngredientsAndQuantities(id, ingredientsAndQuantities);
  await addInstructions(id, instructions);
}

async function addInstructions(recipe_id, instructions) {
  for (let instruction of instructions) {
    let { number, step } = instruction;
    await DButils.execQuery(
      `insert into instructions values ('${number}','${step}','${recipe_id}')`
    );
  }
  console.log("finish insert to instructions");
}

async function addIngredientsAndQuantities(
  recipe_id,
  ingredientsAndQuantities
) {
  for (let ingredient of ingredientsAndQuantities) {
    let { originalName, amount } = ingredient;
    await DButils.execQuery(
      `insert into ingredientsAndQuantities values ('${originalName}','${amount}','${recipe_id}')`
    );
  }
  console.log("finish insert to ingredientsAndQuantities");
}

async function getPersonalRecipe(recipe_id) {
  const personalRecipe = await DButils.execQuery(
    `SELECT * FROM usersPersonalRecipes WHERE recipe_id = ${recipe_id}`
  );
  return personalRecipe[0];
}

async function getIngredients(recipe_id) {
  return await DButils.execQuery(
    `SELECT * FROM ingredientsAndQuantities WHERE recipe_id_ingredients = ${recipe_id}`
  );
}

async function getInstructions(recipe_id) {
  return await DButils.execQuery(
    `SELECT * FROM instructions WHERE recipe_id_instructions = ${recipe_id}`
  );
}

async function addRecipeToUpcommingMeal(user_id, recipe_id, personal) {
  let personal_val ;
  if (personal){
    personal_val =1;
  }
  else{
    personal_val =0;
  }
  let index = await getOrderOfLastRecipe(user_id);
  await DButils.execQuery(
    `insert into mealplanningrecipes values ('${user_id}','${recipe_id}','${personal_val}', '${index}')`
  );
}

async function getOrderOfLastRecipe(user_id){
  let max_order ;
  await DButils.execQuery(`SELECT MAX(order_num) FROM mealplanningrecipes WHERE user_id=${user_id}`)
  .then(res => {
    console.log(res[0]['MAX(order_num)']);
    max_order = Number(res[0]['MAX(order_num)'])+1;
  });
  console.log(`max_order is: ${max_order}`);
  return max_order;
}


async function getRecipesUpcommingMeal(user_id){
  return await DButils.execQuery(
    `SELECT recipe_id,is_personal,order_num FROM mealplanningrecipes WHERE user_id=${user_id} ORDER BY order_num;`
  );
}

async function changeRecipeOrderInMeal(user_id,recipeId, neworder){
  //check value of prev order
  let old_order ;
  await DButils.execQuery(`SELECT order_num FROM mealplanningrecipes WHERE user_id=${user_id} AND recipe_id=${recipeId}`)
  .then(res => {
    console.log(res[0]['order_num']);
    old_order = Number(res[0]['order_num']);
  });
  console.log(`old_order is: ${old_order}`);

  if(old_order<neworder){
    await DButils.execQuery(`UPDATE mealplanningrecipes 
    SET order_num = order_num-1
    WHERE user_id = ${user_id} AND order_num>${old_order} AND order_num<=${neworder};`);
  }
  else if(old_order>neworder){
    await DButils.execQuery(`UPDATE mealplanningrecipes 
    SET order_num = order_num+1
    WHERE user_id = ${user_id} AND order_num>=${neworder} AND order_num<${old_order};`);
  }
  await DButils.execQuery(
    `UPDATE mealplanningrecipes 
    SET order_num = ${neworder}
    WHERE user_id = ${user_id} AND recipe_id=${recipeId};`
  );
}

async function removeRecipeFromMeal(user_id,recipe_id){
  await DButils.execQuery(
    `DELETE FROM mealplanningrecipes WHERE user_id = ${user_id} AND recipe_id=${recipe_id};`
  );
}

async function removeAllRecipesFromMeal(user_id){
  await DButils.execQuery(
    `DELETE FROM mealplanningrecipes WHERE user_id = ${user_id};`
  );
}

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.isRecipeFavorite = isRecipeFavorite;
exports.isRecipeViewed = isRecipeViewed;
exports.viewRecipe = viewRecipe;
exports.getNewestViewedRecipes = getNewestViewedRecipes;
exports.addNewRecipeToDb = addNewRecipeToDb;
exports.getPersonalRecipe = getPersonalRecipe;
exports.getIngredients = getIngredients;
exports.getInstructions = getInstructions;
exports.getPersonalRecipes = getPersonalRecipes;
exports.addRecipeToUpcommingMeal = addRecipeToUpcommingMeal;
exports.getRecipesUpcommingMeal = getRecipesUpcommingMeal;
exports.changeRecipeOrderInMeal = changeRecipeOrderInMeal;
exports.getOrderOfLastRecipe = getOrderOfLastRecipe;
exports.removeRecipeFromMeal =removeRecipeFromMeal;
exports.removeAllRecipesFromMeal =removeAllRecipesFromMeal;
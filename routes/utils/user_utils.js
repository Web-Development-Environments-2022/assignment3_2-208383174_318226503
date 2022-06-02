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

async function isRecipeFavorite(user_id, recipe_id) {
  const favoriteRecipe = await DButils.execQuery(
    `select * from FavoriteRecipes where user_id='${user_id}' AND recipe_id='${recipe_id}'`
  );
  return favoriteRecipe.length !== 0;
}

async function isRecipeViewed(user_id, recipe_id) {
  // viewed = await DButils.execQuery(
  //   "SELECT user_id AND recipe_id from usersRecipesViews"
  // );
  // if (viewed.find((x) => x.user_id === user_id && x.recipe_id === recipe_id)) {
  //   console.log(`recipe ${recipe_id} was viewed by ${user_id}`);
  //   return true;
  // }
  // console.log(`recipe ${recipe_id} was NOT viewed by ${user_id}`);
  // return false;

  const viewedRecipe = await DButils.execQuery(
    `select * from usersRecipesViews where user_id='${user_id}' AND recipe_id='${recipe_id}'`
  );

  // console.log(viewedRecipe);
  // console.log(viewedRecipe.length);
  // return !(viewedRecipe.length === 0);
  if (!(viewedRecipe.length === 0)) {
    console.log(`recipe ${recipe_id} was viewed by ${user_id}`);
    return true;
  } else {
    console.log(`recipe ${recipe_id} was NOT viewed by ${user_id}`);
    return false;
  }
}

async function viewRecipe(user_id, recipe_id) {
  let isViewed = await isRecipeViewed(user_id, recipe_id);
  console.log("is viweed value is " + isViewed);
  if (isViewed) {
    await DButils.execQuery(
      `DELETE FROM usersRecipesviews where user_id='${user_id}' AND recipe_id='${recipe_id}'`
    );
    console.log("deleting");
  }
  console.log("inserting");
  await DButils.execQuery(
    `insert into usersrecipesviews values ('${user_id}',${recipe_id})`
  );
  console.log("done inserting");
}

async function getNewestViewedRecipes(user_id, num_of_recipes) {
  const recipes_id = await DButils.execQuery(
    `SELECT recipe_id FROM  usersrecipesviews WHERE  user_id = ${user_id} ORDER  BY recipe_id DESC
    LIMIT ${num_of_recipes};
    `
  );
  return recipes_id;
}

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.isRecipeFavorite = isRecipeFavorite;
exports.isRecipeViewed = isRecipeViewed;
exports.viewRecipe = viewRecipe;
exports.getNewestViewedRecipes = getNewestViewedRecipes;

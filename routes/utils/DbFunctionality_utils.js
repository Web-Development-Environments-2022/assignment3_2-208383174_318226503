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
  instructions,
  analyzedInstructions
) {
  console.log("adding new recipe to db");
  popularity = 0;
  const newRecipe = await DButils.execQuery(
    `INSERT INTO usersPersonalRecipes (user_id, title, image, readyInMinutes, popularity, vegan, vegetarian, glutenFree, servingSize) VALUES ('${user_id}','${title}','${image}','${readyInMinutes}','${popularity}',${vegan},'${vegetarian}','${glutenFree}', '${servingSize}')`
  );
  console.log("finished adding to userPersonalRecipes");
  let recipe_id = newRecipe.insertId;
  await addIngredientsAndQuantities(recipe_id, ingredientsAndQuantities);
  await addInstructions(recipe_id, instructions);
  await addAnalyzedInstructions(recipe_id, analyzedInstructions);
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

async function addAnalyzedInstructions(recipe_id, analyzedInstructions) {
  let name = analyzedInstructions[0].name;
  await DButils.execQuery(
    `insert into analyzedinstructions values ('${name}','${recipe_id}')`
  );
  await addAnalyzedSteps(recipe_id, name, analyzedInstructions[0]);
}

async function addAnalyzedSteps(recipe_id, element_name, analyzedInstructions) {
  let steps = analyzedInstructions.steps;
  for (let specific_step of steps) {
    let { number, step, ingredients, equipment, length } = specific_step;
    let length_num = null;
    let length_unit = null;
    if (length != undefined) {
      length_num = length.number;
      length_unit = length.unit;
      await DButils.execQuery(
        `insert into steps_analyzed values ('${number}','${step}','${recipe_id}','${element_name}','${length_num}','${length_unit}' )`
      );
    } else {
      await DButils.execQuery(
        `insert into steps_analyzed values ('${number}','${step}','${recipe_id}','${element_name}', NULL, NULL)`
      );
    }

    await addAnalyzedIngredientsAndEquipment(
      number,
      recipe_id,
      ingredients,
      equipment
    );
  }
}

async function addAnalyzedIngredientsAndEquipment(
  number,
  recipe_id,
  ingredients,
  equipments
) {
  for (let ingredient of ingredients) {
    let { name, image } = ingredient;
    await DButils.execQuery(
      `insert into ingredients_analyzed values ('${name}','${image}','${recipe_id}','${number}')`
    );
  }
  for (let equipment of equipments) {
    let { name, image, temperature } = equipment;
    if (temperature != undefined) {
      let temperature_number = temperature.number;
      let temperature_unit = temperature.unit;
      await DButils.execQuery(
        `insert into equipment_analyzed values ('${name}','${image}','${recipe_id}','${number}','${temperature_number}','${temperature_unit}')`
      );
    } else {
      await DButils.execQuery(
        `insert into equipment_analyzed values ('${name}','${image}','${recipe_id}','${number}',NULL,NULL)`
      );
    }
  }
}

async function getPersonalRecipePreview(recipe_id) {
  const personalRecipe = await DButils.execQuery(
    `SELECT * FROM usersPersonalRecipes WHERE recipe_id = ${recipe_id}`
  );
  return personalRecipe[0];
}

async function getAdditionalInformationPersonal(recipe_id) {
  const ingredients = await DButils.execQuery(
    `SELECT * FROM ingredientsAndQuantities WHERE recipe_id_ingredients = ${recipe_id}`
  );
  console.log("222 " + ingredients);
  console.log("333 " + ingredients[0]);

  const instructions = await DButils.execQuery(
    `SELECT * FROM instructions WHERE recipe_id_instructions = ${recipe_id}`
  );
  return {
    ingredients,
    instructions,
  };
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

async function getAnalyzedRecipe(recipe_id) {
  return await DButils.execQuery(
    `SELECT * FROM instructions WHERE recipe_id_instructions = ${recipe_id}`
  );
}

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.isRecipeFavorite = isRecipeFavorite;
exports.isRecipeViewed = isRecipeViewed;
exports.viewRecipe = viewRecipe;
exports.getNewestViewedRecipes = getNewestViewedRecipes;
exports.addNewRecipeToDb = addNewRecipeToDb;
exports.getPersonalRecipePreview = getPersonalRecipePreview;
exports.getIngredients = getIngredients;
exports.getInstructions = getInstructions;
exports.getPersonalRecipes = getPersonalRecipes;
exports.getAdditionalInformationPersonal = getAdditionalInformationPersonal;

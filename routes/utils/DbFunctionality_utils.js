const { use } = require("../user");
const DButils = require("./DButils");

async function getHighestPersonalIndex() {
  let reipce_id = await DButils.execQuery(
    `SELECT recipe_id FROM userspersonalrecipes ORDER BY RECIPE_ID DESC LIMIT 1;`
  );
  return reipce_id[0].recipe_id;
}

// mark the recipe as favorite by a logged in user- both from api and personals
async function markAsFavorite(user_id, recipe_id, personal) {
  let is_personal;
  if (personal == "false") {
    is_personal = 0;
  } else {
    is_personal = 1;
  }
  let favorite = await isRecipeFavorite(user_id, recipe_id);
  if (favorite == false) {
    await DButils.execQuery(
      `insert into FavoriteRecipes values ('${user_id}',${recipe_id},'${is_personal}')`
    );
    return true;
  }
  return false;
}

// unmark the recipe as favorite by a logged in user- both from api and personals
async function unmarkAsFavorite(user_id, recipe_id, personal) {
  let is_personal;
  if (personal === "false") {
    is_personal = 0;
  } else {
    is_personal = 1;
  }
  let favorite = await isRecipeFavorite(user_id, recipe_id);
  if (favorite == true) {
    await DButils.execQuery(
      `DELETE FROM FavoriteRecipes WHERE user_id='${user_id}' AND recipe_id=${recipe_id} AND is_personal='${is_personal}'`
    );
    return true;
  }
  return false;
}

// get all favorite recipes by a user
async function getFavoriteRecipes(user_id) {
  const recipes = await DButils.execQuery(
    `select * from FavoriteRecipes where user_id='${user_id}'`
  );
  return recipes;
}

// get all personal recipes by a user
async function getPersonalRecipes(user_id) {
  const recipes_id = await DButils.execQuery(
    `select recipe_id from usersPersonalRecipes where user_id='${user_id}' ORDER BY RECIPE_ID DESC`
  );
  return recipes_id;
}

// return if a recipe is a user's favorite
async function isRecipeFavorite(user_id, recipe_id) {
  const favoriteRecipe = await DButils.execQuery(
    `select * from FavoriteRecipes where user_id='${user_id}' AND recipe_id='${recipe_id}'`
  );
  return favoriteRecipe.length !== 0;
}

// return if a recipe has been viewed by a user
async function isRecipeViewed(user_id, recipe_id) {
  const viewedRecipe = await DButils.execQuery(
    `select * from usersRecipesViews where user_id='${user_id}' AND recipe_id='${recipe_id}'`
  );
  return viewedRecipe.length != 0;
}

// mark recipe as viewed IN DB
async function viewRecipe(user_id, recipe_id) {
  let isViewed = await isRecipeViewed(user_id, recipe_id);
  if (isViewed) {
    await DButils.execQuery(
      `UPDATE usersRecipesviews
      SET time_stamp = CURRENT_TIMESTAMP()
      WHERE user_id='${user_id}' AND recipe_id='${recipe_id}';`
    );
    console.log(`updating user ${user_id} watched ${recipe_id}`);
    return;
  }
  await DButils.execQuery(
    `INSERT INTO usersrecipesviews (user_id, recipe_id) VALUES ('${user_id}',${recipe_id})`
  );
  console.log(`inserting user ${user_id} watched ${recipe_id}`);
}

async function isFirstTime(user_id, recipe_id) {
  return !isRecipeViewed(user_id, recipe_id);
}

// get the n newest viewed recipes by a user
async function getNewestViewedRecipes(user_id, num_of_recipes) {
  const recipes_id = await DButils.execQuery(
    `SELECT recipe_id FROM usersrecipesviews WHERE user_id = ${user_id} ORDER BY time_stamp DESC
    LIMIT ${num_of_recipes};
    `
  );
  return recipes_id;
}

// add a personal recipe to the db
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
    `INSERT INTO usersPersonalRecipes (user_id, title, image, readyInMinutes, popularity, vegan, vegetarian, glutenFree, servingSize) VALUES ('${user_id}','${title}','${image}',${readyInMinutes},'${popularity}',${vegan},${vegetarian},${glutenFree}, ${servingSize})`
  );
  console.log("finished adding to userPersonalRecipes");
  let recipe_id = newRecipe.insertId;
  if (ingredientsAndQuantities != undefined) {
    await addIngredientsAndQuantities(recipe_id, ingredientsAndQuantities);
  }
  if (instructions != undefined) {
    console.log("adding instructions to db");
    await addInstructions(recipe_id, instructions);
  }
  if (analyzedInstructions) {
    await addAnalyzedInstructions(recipe_id, analyzedInstructions);
  }
  console.log(
    `finished adding recipe by user ${user_id} with title ${title} and id ${recipe_id}`
  );
  return recipe_id;
}

// adding instructions to a personal user
async function addInstructions(recipe_id, instructions) {
  for (let instruction of instructions) {
    let { number, step } = instruction;
    await DButils.execQuery(
      `insert into instructions values ('${number}','${step}','${recipe_id}')`
    );
  }
  console.log("finish insert to instructions");
}

// adding ingredients and quantities to a personal user
async function addIngredientsAndQuantities(
  recipe_id,
  ingredientsAndQuantities
) {
  for (let ingredient of ingredientsAndQuantities) {
    let { ingredientName, amount, unit } = ingredient;
    if (unit == "" || unit == undefined) {
      unit = null;
    }
    await DButils.execQuery(
      `insert into ingredientsAndQuantities values ('${ingredientName}','${amount}','${recipe_id}','${unit}')`
    );
  }
  console.log("finish insert to ingredientsAndQuantities");
}

// getting the preview information of a personal recipe
async function getPersonalRecipePreview(user_id, recipe_id) {
  console.log(
    `getting from db peronsl recipe ${recipe_id} with user id ${user_id}`
  );
  try {
    const personalRecipe = await DButils.execQuery(
      `SELECT * FROM usersPersonalRecipes WHERE user_id = ${user_id} AND recipe_id = ${recipe_id}`
    );
    if (personalRecipe[0] === undefined) {
      return -1;
    }
    return personalRecipe[0];
  } catch (error) {
    return;
  }
}

// getting the ingredients and instructions to a personal recipe
async function getAdditionalInformationPersonal(recipe_id) {
  let ingredients = await getIngredientsPersonal(recipe_id);
  let instructions = await getInstructionsPersonal(recipe_id);
  return {
    ingredients: ingredients,
    instructions: instructions,
  };
}

// getting the ingredients to a personal recipe
async function getIngredientsPersonal(recipe_id) {
  const ingredients = await DButils.execQuery(
    `SELECT * FROM ingredientsAndQuantities WHERE recipe_id_ingredients = ${recipe_id}`
  );
  let all_ingredients = [];
  for (let ingredient of ingredients) {
    all_ingredients.push({
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit,
    });
  }
  return all_ingredients;
}

// getting the instructions to a personal recipe
async function getInstructionsPersonal(recipe_id) {
  const instructions = await DButils.execQuery(
    `SELECT * FROM instructions WHERE recipe_id_instructions = ${recipe_id}`
  );
  let all_instructions = [];
  for (let instruction of instructions) {
    all_instructions.push({
      number: instruction.number,
      step: instruction.step,
    });
  }
  return all_instructions;
}

// getting the family recipes
async function getFamilyRecipes(user_id) {
  const recipes = await DButils.execQuery(
    `SELECT * FROM userfamilyrecipes WHERE user_id = ${user_id}`
  );
  return recipes;
}

/*
----------------------------- Analyzed instructions -----------------------------
*/

// adding analyzed instructions to match the making meal page to a personal recipe
async function addAnalyzedInstructions(recipe_id, analyzedInstructions) {
  let index_of_element = 0;
  for (let element of analyzedInstructions) {
    let element_name = element.name;
    await DButils.execQuery(
      `insert into analyzedinstructions values (${index_of_element}, '${element_name}','${recipe_id}')`
    );
    index_of_element += 1;
    await addAnalyzedSteps(recipe_id, element_name, element);
  }
}

// adding the analyzed steps from a personal recipe to the db
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
      element_name,
      ingredients,
      equipment
    );
  }
}

// adding the ingredients and equipment from a personal recipe to the db
async function addAnalyzedIngredientsAndEquipment(
  number,
  recipe_id,
  element_name,
  ingredients,
  equipments
) {
  for (let ingredient of ingredients) {
    let { name, image } = ingredient;
    await DButils.execQuery(
      `insert into ingredients_analyzed values ('${name}','${image}','${recipe_id}','${number}','${element_name}')`
    );
  }
  for (let equipment of equipments) {
    let { name, image, temperature } = equipment;
    if (temperature != undefined) {
      let temperature_number = temperature.number;
      let temperature_unit = temperature.unit;
      await DButils.execQuery(
        `insert into equipment_analyzed values ('${name}','${image}','${recipe_id}','${number}','${temperature_number}','${temperature_unit}','${element_name}')`
      );
    } else {
      await DButils.execQuery(
        `insert into equipment_analyzed values ('${name}','${image}','${recipe_id}','${number}',NULL,NULL,'${element_name}')`
      );
    }
  }
}

// getting analyzed instructions to a personal recipe
async function getAnalyzedInstructionsPersonal(recipe_id) {
  const analyzedInstructions = await DButils.execQuery(
    `SELECT * FROM analyzedinstructions WHERE recipe_id = ${recipe_id} ORDER BY element_order`
  );
  all_elements = [];
  for (let element of analyzedInstructions) {
    let steps = await getStepsAnalyzedPersonal(element.name, recipe_id);
    all_elements.push({
      name: element.name,
      steps: steps,
    });
  }
  return all_elements;
}

// getting the steps to an analyzed personal recipe
async function getStepsAnalyzedPersonal(element_name, recipe_id) {
  const steps = await DButils.execQuery(
    `SELECT * FROM steps_analyzed WHERE recipe_id = ${recipe_id} AND element_name='${element_name}'`
  );
  all_steps = [];
  for (let specific_step of steps) {
    let step_id = specific_step.number;
    let ingredients = await getAnalyzedIngredientsPersonal(
      step_id,
      recipe_id,
      element_name
    );
    let equipment = await getAnalyzedEquipmentPersonal(
      step_id,
      recipe_id,
      element_name
    );
    let { number, step, length_number, length_unit } = specific_step;
    if (length_number != undefined) {
      all_steps.push({
        number: number,
        step: step,
        ingredients: ingredients,
        equipment: equipment,
        length: {
          number: length_number,
          unit: length_unit,
        },
      });
    } else {
      all_steps.push({
        number: number,
        step: step,
        ingredients: ingredients,
        equipment: equipment,
      });
    }
  }
  return all_steps;
}

// getting the ingredients to an analyzed personal recipe
async function getAnalyzedIngredientsPersonal(
  step_num,
  recipe_id,
  element_name
) {
  const ingredients = await DButils.execQuery(
    `SELECT * FROM ingredients_analyzed WHERE recipe_id = ${recipe_id} AND step_num=${step_num} AND element_name='${element_name}'`
  );
  all_ingredients = [];
  for (let specific_ingredient of ingredients) {
    let { name, image } = specific_ingredient;
    all_ingredients.push({
      name: name,
      image: image,
    });
  }
  return all_ingredients;
}

// getting the equipment to an analyzed personal recipe
async function getAnalyzedEquipmentPersonal(step_num, recipe_id, element_name) {
  const equipments = await DButils.execQuery(
    `SELECT * FROM equipment_analyzed WHERE recipe_id = ${recipe_id} AND step_num = ${step_num} AND element_name='${element_name}'`
  );
  all_equipment = [];
  for (let specific_equipment of equipments) {
    let { name, image, temperature_number, temperature_unit } =
      specific_equipment;
    if (temperature_number != undefined) {
      all_equipment.push({
        name: name,
        image: image,
        temperature: {
          number: temperature_number,
          unit: temperature_unit,
        },
      });
    } else {
      all_equipment.push({
        name: name,
        image: image,
      });
    }
    return all_equipment;
  }
}


// --------------------------- upcoming meal -----------------------------

// adding recipe to upcoming meal
async function addRecipeToupcomingMeal(user_id, recipe_id, personal) {
  let personal_val;
  console.log("personal in DBFunc addRecipeToupcomingMeal is: " + personal);
  if (personal == "true") {
    personal_val = 1;
  } else {
    personal_val = 0;
  }
  let index = await getOrderOfLastRecipe(user_id);
  await DButils.execQuery(
    `insert into mealplanningrecipes values ('${user_id}','${recipe_id}','${personal_val}', '${index}')`
  );
}

// getting the order of the last recipe in an upcoming meal
async function getOrderOfLastRecipe(user_id) {
  let max_order;
  await DButils.execQuery(
    `SELECT MAX(order_num) FROM mealplanningrecipes WHERE user_id=${user_id}`
  ).then((res) => {
    max_order = Number(res[0]["MAX(order_num)"]) + 1;
  });
  return max_order;
}

// getting the upcoming meal for a user
async function getRecipesupcomingMeal(user_id) {
  return await DButils.execQuery(
    `SELECT recipe_id,isPersonal,order_num FROM mealplanningrecipes WHERE user_id=${user_id} ORDER BY order_num;`
  );
}

// changing the order of an upcoming meal for a user
async function changeRecipeOrderInMeal(user_id, recipeId, neworder) {
  //check value of prev order
  let old_order;
  await DButils.execQuery(
    `SELECT order_num FROM mealplanningrecipes WHERE user_id=${user_id} AND recipe_id=${recipeId}`
  ).then((res) => {
    old_order = Number(res[0]["order_num"]);
  });
  if (old_order < neworder) {
    await DButils.execQuery(`UPDATE mealplanningrecipes 
    SET order_num = order_num-1
    WHERE user_id = ${user_id} AND order_num>${old_order} AND order_num<=${neworder};`);
  } else if (old_order > neworder) {
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

// removing recipe from an upcoming meal by a user
async function removeRecipeFromMeal(user_id, recipe_id) {
  await DButils.execQuery(
    `DELETE FROM mealplanningrecipes WHERE user_id = ${user_id} AND recipe_id=${recipe_id};`
  );
}

// removing all recipes from an upcoming meal by a user
async function removeAllRecipesFromMeal(user_id) {
  await DButils.execQuery(
    `DELETE FROM mealplanningrecipes WHERE user_id = ${user_id};`
  );
}

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.unmarkAsFavorite = unmarkAsFavorite;
exports.isRecipeFavorite = isRecipeFavorite;
exports.isRecipeViewed = isRecipeViewed;
exports.viewRecipe = viewRecipe;
exports.getNewestViewedRecipes = getNewestViewedRecipes;
exports.addNewRecipeToDb = addNewRecipeToDb;
exports.getPersonalRecipePreview = getPersonalRecipePreview;
exports.getPersonalRecipes = getPersonalRecipes;
exports.getAdditionalInformationPersonal = getAdditionalInformationPersonal;
exports.getAnalyzedInstructionsPersonal = getAnalyzedInstructionsPersonal;
exports.addRecipeToupcomingMeal = addRecipeToupcomingMeal;
exports.getRecipesupcomingMeal = getRecipesupcomingMeal;
exports.changeRecipeOrderInMeal = changeRecipeOrderInMeal;
exports.getOrderOfLastRecipe = getOrderOfLastRecipe;
exports.removeRecipeFromMeal = removeRecipeFromMeal;
exports.removeAllRecipesFromMeal = removeAllRecipesFromMeal;
exports.getHighestPersonalIndex = getHighestPersonalIndex;
exports.getFamilyRecipes = getFamilyRecipes;

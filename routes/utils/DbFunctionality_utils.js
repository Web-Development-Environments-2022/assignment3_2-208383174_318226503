const DButils = require("./DButils");

// mark the recipe as favorite by a logged in user
async function markAsFavorite(user_id, recipe_id) {
  if (!isRecipeFavorite(user_id, recipe_id)) {
    await DButils.execQuery(
      `insert into FavoriteRecipes values ('${user_id}',${recipe_id})`
    );
    return 1;
  }
  return 0;
}

// get all favorite recipes by a user
async function getFavoriteRecipes(user_id) {
  const recipes_id = await DButils.execQuery(
    `select recipe_id from FavoriteRecipes where user_id='${user_id}'`
  );
  return recipes_id;
}

// get all personal recipes by a user
async function getPersonalRecipes(user_id) {
  const recipes_id = await DButils.execQuery(
    `select recipe_id from usersPersonalRecipes where user_id='${user_id}'`
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
  console.log(
    `cheking recipe viewed user id: ${user_id} recipe id ${recipe_id}`
  );
  const viewedRecipe = await DButils.execQuery(
    `select * from usersRecipesViews where user_id='${user_id}' AND recipe_id='${recipe_id}'`
  );
  console.log("result " + viewedRecipe);
  console.log("result " + viewedRecipe.length);
  return viewedRecipe.length != 0;
}

// mark recipe as viewed IN DB
async function viewRecipe(user_id, recipe_id) {
  let isViewed = await isRecipeViewed(user_id, recipe_id);
  if (isViewed) {
    console.log("recipe viewed");
    await DButils.execQuery(
      `DELETE FROM usersRecipesviews where user_id='${user_id}' AND recipe_id='${recipe_id}'`
    );
  }
  await DButils.execQuery(
    `insert into usersrecipesviews (user_id, recipe_id) VALUES ('${user_id}',${recipe_id})`
  );
}

// get the n newest viewed recipes by a user
async function getNewestViewedRecipes(user_id, num_of_recipes) {
  const recipes_id = await DButils.execQuery(
    `SELECT recipe_id FROM usersrecipesviews WHERE user_id = ${user_id} ORDER BY id DESC
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
    `INSERT INTO usersPersonalRecipes (user_id, title, image, readyInMinutes, popularity, vegan, vegetarian, glutenFree, servingSize) VALUES ('${user_id}','${title}','${image}','${readyInMinutes}','${popularity}',${vegan},'${vegetarian}','${glutenFree}', '${servingSize}')`
  );
  console.log("finished adding to userPersonalRecipes");
  let recipe_id = newRecipe.insertId;
  await addIngredientsAndQuantities(recipe_id, ingredientsAndQuantities);
  await addInstructions(recipe_id, instructions);
  await addAnalyzedInstructions(recipe_id, analyzedInstructions);
  console.log("finished adding user");
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
    let { originalName, amount } = ingredient;
    await DButils.execQuery(
      `insert into ingredientsAndQuantities values ('${originalName}','${amount}','${recipe_id}')`
    );
  }
  console.log("finish insert to ingredientsAndQuantities");
}

// adding analyzed instructions to match the making meal page to a personal recipe
async function addAnalyzedInstructions(recipe_id, analyzedInstructions) {
  let name = analyzedInstructions[0].name;
  await DButils.execQuery(
    `insert into analyzedinstructions values ('${name}','${recipe_id}')`
  );
  await addAnalyzedSteps(recipe_id, name, analyzedInstructions[0]);
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
      ingredients,
      equipment
    );
  }
}

// adding the ingredients and equipment from a personal recipe to the db
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

// getting the preview information of a personal recipe
async function getPersonalRecipePreview(recipe_id) {
  const personalRecipe = await DButils.execQuery(
    `SELECT * FROM usersPersonalRecipes WHERE recipe_id = ${recipe_id}`
  );
  return personalRecipe[0];
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

/*
----------------------------- Analyzed instructions -----------------------------
*/

// getting analyzed instructions to a personal recipe
async function getAnalyzedInstructionsPersonal(recipe_id) {
  const analyzedInstructions = await DButils.execQuery(
    `SELECT * FROM analyzedinstructions WHERE recipe_id = ${recipe_id}`
  );
  all_elements = [];
  for (let element of analyzedInstructions) {
    all_elements.push(await getStepsAnalyzedPersonal(element.name, recipe_id));
  }
  return all_elements;
}

// getting the steps to an analyzed personal recipe
async function getStepsAnalyzedPersonal(name, recipe_id) {
  const steps = await DButils.execQuery(
    `SELECT * FROM steps_analyzed WHERE recipe_id = ${recipe_id} AND name='${name}'`
  );
  all_steps = [];
  for (let specific_step of steps) {
    let step_id = specific_step.number;
    let ingredients = await getAnalyzedIngredientsPersonal(step_id, recipe_id);
    let equipment = await getAnalyzedEquipmentPersonal(step_id, recipe_id);
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
async function getAnalyzedIngredientsPersonal(step_num, recipe_id) {
  const ingredients = await DButils.execQuery(
    `SELECT * FROM ingredients_analyzed WHERE recipe_id = ${recipe_id} AND step_num=${step_num}`
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
async function getAnalyzedEquipmentPersonal(step_num, recipe_id) {
  const equipments = await DButils.execQuery(
    `SELECT * FROM equipment_analyzed WHERE recipe_id = ${recipe_id} AND step_num = ${step_num}`
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

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.isRecipeFavorite = isRecipeFavorite;
exports.isRecipeViewed = isRecipeViewed;
exports.viewRecipe = viewRecipe;
exports.getNewestViewedRecipes = getNewestViewedRecipes;
exports.addNewRecipeToDb = addNewRecipeToDb;
exports.getPersonalRecipePreview = getPersonalRecipePreview;
exports.getPersonalRecipes = getPersonalRecipes;
exports.getAdditionalInformationPersonal = getAdditionalInformationPersonal;
exports.getAnalyzedInstructionsPersonal = getAnalyzedInstructionsPersonal;

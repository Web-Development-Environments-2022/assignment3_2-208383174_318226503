var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const dbFunctionality_utils = require("./utils/DbFunctionality_utils");
const recipes_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users")
      .then((users) => {
        if (users.find((x) => x.user_id === req.session.user_id)) {
          req.user_id = req.session.user_id;
          next();
        }
      })
      .catch((err) => next(err));
  } else {
    res.sendStatus(401);
  }
});

router.get("/", (req, res) => res.send("im in user"));

/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post("/favorites", async (req, res, next) => {
  const user_id = req.session.user_id;
  const recipe_id = req.body.recipeId;
  let ans = await dbFunctionality_utils.markAsFavorite(user_id, recipe_id);
  if (ans == 1) {
    res.status(200).send("The Recipe successfully saved as favorite");
  } else {
    throw { status: 409, message: "recipe was already added as favorite" };
  }
});

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get("/favorites", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const favorite_recipes = await recipes_utils.getFavoriteRecipes(user_id);
    if (favorite_recipes.length > 0) {
      res.status(200).send(favorite_recipes);
    } else {
      res.status(204).send("you don't have favorite recipes");
    }
  } catch (error) {
    next(error);
  }
});

/**
 * Adding a new personal recipe by a user
 */
router.post("/add", async (req, res, next) => {
  const user_id = req.session.user_id;
  try {
    await recipes_utils.addNewRecipeByUser(user_id, req);
    res.status(200).send("New Personal Recipe successfully saved");
  } catch (error) {
    next(error);
  }
});

/**
 * Getting all the personal recipes by a user
 */
router.get("/myRecipes", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const personal_recipes = await recipes_utils.getPersonalRecipes(user_id);
    if (personal_recipes.length > 0) {
      res.status(200).send(personal_recipes);
    } else {
      res.status(204).send("you don't have personal recipes");
    }
  } catch (error) {
    next(error);
  }
});

/**
 * Getting the 3 recipes that the user last viewed
 * For the Main Page
 */
router.get("/lastThreeViewed", async (req, res, next) => {
  const user_id = req.session.user_id;
  try {
    let last_viewed_recipes = await recipes_utils.getNewestViewed(user_id, 3);
    res.send(last_viewed_recipes);
  } catch (error) {
    next(error);
  }
});

/* personal recipes */

/*
  getting a preview for a personal recipe
*/
router.get("/personalPreview", async (req, res, next) => {
  try {
    const recipe_id = req.query.recipe_id;
    const personal_recipes = await recipes_utils.getRecipePreviewPersonal(
      recipe_id
    );
    res.status(200).send(personal_recipes);
  } catch (error) {
    next(error);
  }
});

/*
  getting a preview for a personal recipe
*/
router.get("/personalFull", async (req, res, next) => {
  try {
    const recipe_id = req.query.recipe_id;
    const personal_recipes = await recipes_utils.getPersonalFull(recipe_id);
    res.status(200).send(personal_recipes);
  } catch (error) {
    next(error);
  }
});

/* 
  getting the full details of a personal recipe
*/
router.get("/personalAnalyzed", async (req, res, next) => {
  try {
    const recipe_id = req.query.recipe_id;
    const personal_recipes =
      await recipes_utils.getPersonalAnalyzedInstructions(recipe_id);
    res.status(200).send(personal_recipes);
  } catch (error) {
    next(error);
  }
});

/* bonus*/
router.get("/getanalyzedInstructions/:recipeId", async (req, res, next) => {
  const user_id = req.session.user_id;
  try {
    const recipe = await recipes_utils.getAnalyzedInstructions(
      req.params.recipeId
    );
    res.send(recipe);
  } catch (error) {
    console.log("error");
    next(error);
  }
});

/* bonus*/
router.post("/addToUpcommingMeal/:recipeId", async (req, res, next) => {
  const user_id = req.session.user_id;
  try {
    await recipes_utils.addRecipeToUpcommingMeal(
      user_id,
      req.params.recipeId,
      req.query.personal
    );
    res.status(200).send("Recipe successfully added to Upcomming meal");
  } catch (error) {
    next(error);
  }
});

//get UpcommingMeal recipes
router.get("/getUpcommingMeal", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const meal_recipes = await recipes_utils.getUpcommingMealRecipes(user_id);
    res.status(200).send(meal_recipes);
  } catch (error) {
    next(error);
  }
});

// get number of upcomming meals
router.get("/getNumRecipesInUpcommingMeal", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const meal_recipes = await recipes_utils.getNumOfUpcommingMealRecipes(
      user_id
    );
    console.log(`number of total recipes: ${meal_recipes}`);
    res.status(200).send(`${meal_recipes}`);
  } catch (error) {
    next(error);
  }
});

//  put change recipe order in meal
router.put("/changeRecipeOrderInMeal/:recipeId", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    await recipes_utils.changeRecipeOrder(
      user_id,
      req.params.recipeId,
      req.query.neworder
    );
    res
      .status(200)
      .send(
        `the order of recipe ${req.params.recipeId} was changed to ${req.query.neworder}`
      );
  } catch (error) {
    next(error);
  }
});

// remove recipe from list
router.put("/removeRecipeFromMeal/:recipeId", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    await recipes_utils.removeRecipeFromMeal(user_id, req.params.recipeId);
    res.status(200).send(`recipe ${req.params.recipeId} was deleted from meal`);
  } catch (error) {
    next(error);
  }
});

//delete all list
router.put("/removeAllRecipesFromMeal", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    await recipes_utils.removeAllRecipeFromMeal(user_id);
    res.status(200).send(`recipes were deleted from meal`);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

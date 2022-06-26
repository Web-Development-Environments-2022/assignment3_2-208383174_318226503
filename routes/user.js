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

/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post("/favorites", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    console.log(`recipe ${recipe_id} was mark as favorite by ${user_id}`);

    const is_personal = req.query.personal;
    let ans = await dbFunctionality_utils.markAsFavorite(
      user_id,
      recipe_id,
      is_personal
    );
    if (ans == 1) {
      res.status(200).send("The Recipe successfully saved as favorite");
    } else {
      throw { status: 409, message: "recipe was already added as favorite" };
    }
  } catch (error) {
    next(error);
  }
});

router.delete("/favorites", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    console.log(`recipe ${recipe_id} was unmark as favorite by ${user_id}`);

    const is_personal = req.body.personal;
    let ans = await dbFunctionality_utils.unmarkAsFavorite(
      user_id,
      recipe_id,
      is_personal
    );
    if (ans == 1) {
      res.status(200).send("The Recipe successfully removed as favorite");
    } else {
      throw { status: 409, message: "recipe is not marked as favorite" };
    }
  } catch (error) {
    next(error);
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
    let recipe_id = await recipes_utils.addNewRecipeByUser(user_id, req);
    if (recipe_id != undefined) {
      res
        .status(200)
        .send(` ${recipe_id} New Personal Recipe successfully added`);
    }
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
// router.get("/lastThreeViewed", async (req, res, next) => {
//   const user_id = req.session.user_id;
//   console.log("getting the last 3 recipes viewed by user " + user_id);

//   try {
//     let last_viewed_recipes = await recipes_utils.getNewestViewed(user_id, 3);
//     res.send(last_viewed_recipes);
//   } catch (error) {
//     next(error);
//   }
// });

router.get("/lastThreeViewed", async (req, res, next) => {
  const user_id = req.session.user_id;
  let num_of_recipes = 3;
  try {
    let random_recipes = [
      {
        id: 716414,
        title: "Red, White & Blue Crepes: Happy July 4th! @driscollsberry",
        image: "https://spoonacular.com/recipeImages/716414-556x370.jpg",
        readyInMinutes: 45,
        popularity: 34,
        vegan: true,
        vegetarian: true,
        glutenFree: true,
        isFavorite: true,
        isViewed: true,
        isPersonal: false,
      },
      {
        id: 716403,
        title: "Easy Lemon Feta Greek Yogurt Dip",
        image: "https://spoonacular.com/recipeImages/716403-556x370.jpg",
        readyInMinutes: 15,
        popularity: 252,
        vegan: false,
        vegetarian: true,
        glutenFree: true,
        isFavorite: false,
        isViewed: false,
        isPersonal: false,
      },
      {
        id: 648339,
        title: "Jalapeno Cheese Quick Bread",
        image: "https://spoonacular.com/recipeImages/648339-556x370.jpg",
        readyInMinutes: 45,
        popularity: 36,
        vegan: false,
        vegetarian: true,
        glutenFree: false,
        isFavorite: false,
        isViewed: true,
        isPersonal: false,
      },
    ];
    res.send(random_recipes);
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
    const recipe_id = req.params.recipeId;
    const personal_recipes = await recipes_utils.getRecipePreviewPersonal(
      recipe_id
    );
    res.status(200).send(personal_recipes);
  } catch (error) {
    next(error);
  }
});

/*
  getting the full details of a personal recipe
*/
router.get("/personal/:recipeId", async (req, res, next) => {
  try {
    const recipe_id = req.params.recipeId;
    const user_id = req.session.user_id;
    let receips;
    let a = await dbFunctionality_utils.getHighestPersonalIndex();
    if (recipe_id > a || recipe_id === undefined) {
      receips = await recipes_utils.viewRecipe(user_id, recipe_id);
    } else {
      receips = await recipes_utils.getPersonalFull(user_id, recipe_id);
    }
    console.log(`getting personal recipe ${recipe_id}`);

    res.status(200).send(receips);
  } catch (error) {
    next(error);
  }
});

/* 
  getting the analyzed details of a personal recipe
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
    res.status(200).send(`total number of recipes ${meal_recipes}`);
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
    res.status(200).send(`all recipes were deleted from meal`);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

/**
 * Getting 3 random recipes from spoonacular
 */
router.get("/random", async (req, res, next) => {
  const user_id = req.session.user_id;
  let NUM_OF_RECIPES = 3;
  try {
    let random_recipes = await recipes_utils.getRandomRecipies(
      user_id,
      NUM_OF_RECIPES
    );
    res.send(random_recipes);
  } catch (error) {
    next(error);
  }
});

// router.get("/random", async (req, res, next) => {
//   const user_id = req.session.user_id;
//   let NUM_OF_RECIPES = 3;
//   let random_recipes = [
//     {
//       id: 716414,
//       title: "Red, White & Blue Crepes: Happy July 4th! @driscollsberry",
//       image: "https://spoonacular.com/recipeImages/716414-556x370.jpg",
//       readyInMinutes: 45,
//       popularity: 34,
//       vegan: true,
//       vegetarian: true,
//       glutenFree: true,
//       isFavorite: true,
//       isViewed: true,
//       isPersonal: false,
//     },
//     {
//       id: 716403,
//       title: "Easy Lemon Feta Greek Yogurt Dip",
//       image: "https://spoonacular.com/recipeImages/716403-556x370.jpg",
//       readyInMinutes: 15,
//       popularity: 252,
//       vegan: false,
//       vegetarian: true,
//       glutenFree: true,
//       isFavorite: false,
//       isViewed: false,
//       isPersonal: false,
//     },
//     {
//       id: 648339,
//       title: "Jalapeno Cheese Quick Bread",
//       image: "https://spoonacular.com/recipeImages/648339-556x370.jpg",
//       readyInMinutes: 45,
//       popularity: 36,
//       vegan: false,
//       vegetarian: true,
//       glutenFree: false,
//       isFavorite: false,
//       isViewed: true,
//       isPersonal: false,
//     },
//   ];
//   res.send(random_recipes);
// });

/**
 * Searching a recipe by a search term
 * supports filtering, inserting number of recipes and sort
 */
router.get("/search/:term", async (req, res, next) => {
  const user_id = req.session.user_id;
  const search_term = req.params.term;
  const cuisine = req.query.cuisine;
  const diet = req.query.diet;
  const intolerance = req.query.intolerance;
  const num_of_recipes = req.query.numOfResults;
  try {
    if (search_term) {
      const recipe = await recipes_utils.searchRecipes(
        user_id,
        search_term,
        cuisine,
        diet,
        intolerance,
        num_of_recipes,
      );
      if (recipe.length > 0) {
        res.send(recipe);
      } else {
        res.status(204).send({
          message: "no recipe matches the given search",
          success: false,
        });
      }
    }
  } catch (error) {
    next(error);
  }
});

// TODO- not used?
/**
 * bonus- getting a recipe's analyzed instructions
 */
router.get("/getanalyzedInstructions/:recipeId", async (req, res, next) => {
  const user_id = req.session.user_id;
  try {
    const recipe = await recipes_utils.getAnalyzedInstructions(
      user_id,
      req.params.recipeId,
      req.query.personal
    );
    res.send(recipe);
  } catch (error) {
    console.log("error at get analyzed Instructions");
    next(error);
  }
});

// TODO- not used?
/**
 * Getting the preview for a recipe
 * Does not mark the recipe as "viewed"
 */
// router.get("/preview/:recipeId", async (req, res, next) => {
//   const user_id = req.session.user_id;
//   const recipe_id = req.params.recipeId;
//   try {
//     if (recipe_id) {
//       let recipe_preview = await recipes_utils.getRecipePreview(
//         user_id,
//         recipe_id
//       );
//       res.send(recipe_preview);
//     }
//   } catch (error) {
//     next(error);
//   }
// });

/**
 * Returns a full details of a recipe by its id
 */
router.get("/:recipeId", async (req, res, next) => {
  let is_personal = req.query.isPersonal;
  const user_id = req.session.user_id;
  const recipe_id = req.params.recipeId;
  if (is_personal === undefined) {
    is_personal = false;
  }
  console.log(
    `recipe detail function. recipe id ${req.params.recipeId} user id ${req.session.user_id} and is personal ${is_personal}`
  );
  try {
    if (recipe_id) {
      recipe = await recipes_utils.viewRecipe(user_id, recipe_id);
      if (recipe === undefined) {
        res.status(204).send({
          message: "no recipe was found with that id",
          success: false,
        });
      } else {
        res.send(recipe);
      }
    }
  } catch (error) {
    next(error);
  }
});

/**
 * Error handling
 */
router.use(function (err, req, res, next) {
  console.log(err);
  res.status(500).send("server error");
});

module.exports = router;

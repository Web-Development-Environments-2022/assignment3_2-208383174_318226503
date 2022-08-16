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
    res.status(200).send(random_recipes);
  } catch (error) {
    next(error);
  }
});

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


/**
 * Returns a full details of a recipe by its id
 */
router.get("/:recipeId", async (req, res, next) => {
  const user_id = req.session.user_id;
  const recipe_id = req.params.recipeId;
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
  if (err.status != undefined){
    res.send(err)  
  }
  else{
  res.status(500).send("server error");
}
});

module.exports = router;

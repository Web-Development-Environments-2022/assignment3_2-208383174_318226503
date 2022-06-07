var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

/**
 * Getting 3 random recipes
 * Ror the Main Page
 */
router.get("/random", async (req, res, next) => {
  const user_id = req.session.user_id;
  let num_of_recipes = 3;
  try {
    let random_recipes = await recipes_utils.getRandomRecipies(
      user_id,
      num_of_recipes
    );
    res.send(random_recipes);
  } catch (error) {
    next(error);
  }
});

/**
 * Getting the preview for a recipe
 * Does not mark the recipe as "viewed"
 */
router.post("/preview", async (req, res, next) => {
  const user_id = req.session.user_id;
  const recipe_id = req.body.recipe_id;
  try {
    let recipe_preview = await recipes_utils.getRecipePreview(
      user_id,
      recipe_id
    );
    res.send(recipe_preview);
  } catch (error) {
    next(error);
  }
});

/** TODO- wip - DOES NOT WORK */
router.get("/search", async (req, res, next) => {
  const user_id = req.session.user_id;
  const search_term = req.query.term;
  const cuisine = req.query.cuisine;
  const diet = req.query.diet;
  const intolerance = req.query.intolerance;
  const num_of_recipes = req.query.numOfResults;
  const sort = req.query.sort;
  try {
    const recipe = await recipes_utils.searchRecipes(
      user_id,
      search_term,
      cuisine,
      diet,
      intolerance,
      num_of_recipes,
      sort
    );
    if (recipe.length > 0) {
      res.send(recipe);
    } else {
      res.status(204).send("no recipe was found");
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
  try {
    const recipe = await recipes_utils.viewRecipe(user_id, req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

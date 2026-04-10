const Recipe = require('../models/Recipe');
const User = require('../models/User');
const Comment = require('../models/Comment');

const getAllRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find().populate('author', 'username');
    res.render('recipeList', { recipes, page: 'recipes' });
  } catch (error) {
    res.status(500).send('Error fetching recipes');
  }
};

const getMyRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ author: req.user.userId }).populate('author', 'username');
    res.render('myRecipes', { recipes, page: 'my-recipes' });
  } catch (error) {
    res.status(500).send('Error fetching your recipes');
  }
};

const getRecipeForm = (req, res) => {
  res.render('recipeForm', { recipe: null, page: 'new-recipe' });
};

const createRecipe = async (req, res) => {
  try {
    const { title, ingredients, instructions, image } = req.body;
    const ingredientsArray = ingredients.split(',').map(i => i.trim());

    const recipeData = {
      title,
      ingredients: ingredientsArray,
      instructions,
      image, // Image URL from form
      author: req.user.userId
    };

    const recipe = new Recipe(recipeData);
    await recipe.save();

    // Add recipe reference to User
    await User.findByIdAndUpdate(req.user.userId, { $push: { recipes: recipe._id } });

    res.redirect('/my-recipes');
  } catch (error) {
    res.status(500).send('Error creating recipe');
  }
};

const getRecipeDetails = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('author', 'username')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username' }
      });
    if (!recipe) return res.status(404).send('Recipe not found');
    res.render('recipeItem', { recipe, page: 'recipe-detail' });
  } catch (error) {
    res.status(500).send('Error fetching recipe details');
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const comment = new Comment({
      text,
      author: req.user.userId,
      recipe: req.params.id
    });
    await comment.save();

    await Recipe.findByIdAndUpdate(req.params.id, { $push: { comments: comment._id } });

    res.redirect(`/recipes/${req.params.id}`);
  } catch (error) {
    res.status(500).send('Error adding comment');
  }
};

const getEditForm = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).send('Recipe not found');

    // Check if user is author
    if (recipe.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).send('Unauthorized');
    }

    res.render('editRecipeForm', { recipe, page: 'edit-recipe' });
  } catch (error) {
    res.status(500).send('Error fetching recipe');
  }
};

const updateRecipe = async (req, res) => {
  try {
    const { title, ingredients, instructions, image } = req.body;
    const ingredientsArray = ingredients.split(',').map(i => i.trim());

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).send('Recipe not found');

    // Check if user is author
    if (recipe.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).send('Unauthorized');
    }

    const recipeData = {
      title,
      ingredients: ingredientsArray,
      instructions,
      image // Image URL from form
    };

    await Recipe.findByIdAndUpdate(req.params.id, recipeData);
    res.redirect('/my-recipes');
  } catch (error) {
    res.status(500).send('Error updating recipe');
  }
};

const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).send('Recipe not found');

    // Check if user is author or admin
    if (recipe.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).send('Unauthorized');
    }

    await Recipe.findByIdAndDelete(req.params.id);
    await User.findByIdAndUpdate(recipe.author, { $pull: { recipes: recipe._id } });
    await Comment.deleteMany({ recipe: recipe._id });

    res.redirect('/my-recipes');
  } catch (error) {
    res.status(500).send('Error deleting recipe');
  }
};

module.exports = {
  getAllRecipes,
  getMyRecipes,
  getRecipeForm,
  createRecipe,
  getEditForm,
  updateRecipe,
  getRecipeDetails,
  addComment,
  deleteRecipe
};

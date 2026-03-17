const Recipe = require('../models/Recipe');
const User = require('../models/User');
const Comment = require('../models/Comment');
const multer = require('multer');
const path = require('path');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const getAllRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find().populate('author', 'username');
    res.render('recipeList', { recipes });
  } catch (error) {
    res.status(500).send('Error fetching recipes');
  }
};

const getMyRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ author: req.user.userId }).populate('author', 'username');
    res.render('myRecipes', { recipes });
  } catch (error) {
    res.status(500).send('Error fetching your recipes');
  }
};

const getRecipeForm = (req, res) => {
  res.render('recipeForm', { recipe: null });
};

const createRecipe = async (req, res) => {
  try {
    const { title, ingredients, instructions } = req.body;
    const ingredientsArray = ingredients.split(',').map(i => i.trim());

    const recipeData = {
      title,
      ingredients: ingredientsArray,
      instructions,
      author: req.user.userId
    };

    if (req.file) {
      recipeData.image = '/uploads/' + req.file.filename;
    }

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
    res.render('recipeItem', { recipe });
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
  upload,
  getAllRecipes,
  getMyRecipes,
  getRecipeForm,
  createRecipe,
  getRecipeDetails,
  addComment,
  deleteRecipe
};

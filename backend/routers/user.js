const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { setUser, getUser } = require('../authservice');
const { checkLogin } = require('../middlewares/auth');



router.post('/signup', async (req, res)=>{
    const hashPassword = bcrypt.hashSync(req.body.password, 10);
    const user = await User.create
       ({ name: req.body.name,
        email: req.body.email,
        password: hashPassword,
        gender: req.body.gender,
        phone: req.body.phone,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        pincode: req.body.pincode
    });
        // console.log(user);

        user.save().then((data)=>{
           return res.status(200).json(data);
        }).catch((error)=>{
           return res.status(400).json(error);
        });
})

router.post('/login', async (req, res)=>{
    const email = req.body.email;
    const user = await User.findOne({email});
    if(!user){
        return res.status(404).json({message: "User not found"});
    }
    const validPassword = bcrypt.compareSync(req.body.password, user.password);
    if(!validPassword){
        return res.json({message: "Invalid Password"});
    }
    const token =  setUser(user);
    console.log(token);
    res.cookie("token", token, {
        httpOnly: false,
        secure: true, // Ensure it's true in production
        sameSite: 'None', // Allow cross-site cookies
        maxAge: 24 * 60 * 60 * 1000, // Cookie expiry (optional, here set to 1 day
        path: '/', // Adjust the path as needed
        // domain: 'admirable-quokka-c4bf0c.netlify.app', // Set your domain
        // partitioned: true // If required by browser policies
    });  
    
    return res.status(200).json({token});
})

router.get('/token/:token', async (req, res)=>{
    const token = req.params.token;
    const user = getUser(token);
    // console.log(user.user);
    return res.json(user.user);
})

router.get("/logout", async (req, res) => {
    console.log("🚀 Logging out user...");

    res.clearCookie("token", {
        httpOnly: true,  // ✅ Must match the settings used when setting the cookie
        secure: true,   // ✅ Must be `true` for HTTPS (on Render)
        sameSite: "None", // ✅ Required for cross-origin requests
        path: "/" // ✅ Must match the original cookie path
    });

    console.log("✅ Cookie cleared");
    return res.status(200).json({ message: "Logged out successfully" });
});


router.put("/profileUpdate", checkLogin, async (req, res) => {
    try {
        // Extract user ID from token (checkLogin middleware sets `req.user`)
        const userId = req.user.user._id;

        // Extract profile update data from request body
        const { name, gender, state, district, pincode, address, mobile } = req.body;

        // Find the user and update details
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { name, gender, state, district, pincode, address, phone: mobile }, // Update fields
            { new: true, runValidators: true } // Return updated user & validate data
        );

        if (!updatedUser) {
            console.log("User not found!");
            return res.status(404).json({ message: "User not found" });
        }
        const token =  setUser(updatedUser);
    res.cookie("token", token, {
        httpOnly: false, // Security: prevents frontend JavaScript access
        secure: true, // Must be true in production with HTTPS
        sameSite: "None", // Required for cross-origin requests
        path: "/", // Ensure it's accessible site-wide
    });

        console.log("Updated User:", updatedUser);
        return res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ message: "Server error", error });
    }
});



router.get("/username", checkLogin, async (req, res)=>{
    const user = req.user.user;
    // console.log("hi"+user);
    if(!user){
        return res.json({message: "User not found"});
    }
    return res.json(user);
})

router.get('/allusers/contact', async (req, res)=>{
    const users = await User.find({});
    return res.json(users);
})

module.exports = router;
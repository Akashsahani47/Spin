import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    username:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
        required:true
    },
    role:{
        type:String,
        enum:["admin","user"],
        default:"user"
    },
    status:{
        type:String,
        enum:["active","banned","pending"],
        default:"active"
    },
    avatarUrl:{
        type:String,
        default: '',
    },
    spinCount:{
        type:Number,
        default:1
    },
    totalSpinPlayed:{
     type: Number,
    default: 0
     },
     hasClaimedFirstSpin: {
     type: Boolean,
     default: false
    },
    cycleSpinCounter: {
    type: Number,
     default: 0 
    },
    code:{
        type:String,
        default:null
    },
},{
    timestamps:true
});
// Hash password before saving user
userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password,salt);
    next();
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password);
};

// Create User model
const User = mongoose.model("User",userSchema);
// Export User model
export default User;

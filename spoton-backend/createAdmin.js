const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = "mongodb+srv://nhanfullstackvippro_db_user:nhan2510@cluster0.z9jtgnz.mongodb.net/spoton_db?appName=Cluster0";

const UserSchema = new mongoose.Schema({
  email: String,
  password_hash: String,
  full_name: String,
  role: String,
});

// Use existing model or create new if not defined
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    const email = "admin@spoton.vn";
    const password = "password123";
    
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    let admin = await User.findOne({ email });
    if (admin) {
      admin.role = 'ADMIN';
      admin.password_hash = password_hash;
      await admin.save();
      console.log("Admin account updated!");
    } else {
      admin = new User({
        email,
        password_hash,
        full_name: "Super Admin",
        role: "ADMIN"
      });
      await admin.save();
      console.log("Admin account created!");
    }
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (e) {
    console.error(e);
  } finally {
    mongoose.connection.close();
  }
}

createAdmin();

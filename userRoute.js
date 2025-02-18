import { register, login, getUser, deleteUser, updateUser } from "./userAController.js";

const routes = new Map([
  ["/register", register],    
  ["/login", login],         
  ["/getUser", getUser],     
  ["/deleteUser", deleteUser] 
  ["/updateUser", updateUser]
]);

export default routes;

import * as express from "express";
import { UserRole } from "../domain/userrole";
import { createUserRole } from "../service/create-user-role";
import { updateUserRole } from "../service/update-user-role";
import { fetchAllUserRoles } from "../service/get-user.roles.service";
import { sanitize } from "../util/sanitize";
import { Validator } from "../validators/validate";
const router = express.Router();
const classifications = [{ id: "PUBLIC", name: "PUBLIC" },
{ id: "PRIVATE", name: "PRIVATE" }, { id: "RESTRICTED", name: "RESTRICTED" }];
const createUserRoleText = "Create User Roles";
const updateUserRoleText = "Update User Roles";

/* GET User roles landing page. */
router.get("/user-roles", (req, res, next) => {
  const responseContent: { [k: string]: any } = {};
  delete req.session.error;
  delete req.session.success;
  fetchAllUserRoles(req).then((response) => {
    responseContent.userroles = JSON.parse(response);
    res.render("user-roles", responseContent);
  })
    .catch((error) => {
      // Call the next middleware, which is the error handler
      next(error);
    });
});

/* GET User roles landing page. */
router.get("/user-roles-list", (req, res, next) => {
  const responseContent: { [k: string]: any } = {};
  if (req.session.error) {
    responseContent.error = req.session.error;
  }
  if (req.session.success) {
    responseContent.success = req.session.success;
  }
  fetchAllUserRoles(req).then((response) => {
    responseContent.userroles = JSON.parse(response);
    res.render("user-roles", responseContent);
  })
    .catch((error) => {
      // Call the next middleware, which is the error handler
      next(error);
    });
});

/* GET create user roles form. */
router.get("/create-user-role-form", (req, res, next) => {
  if (req.query.save) {
    delete req.session.error;
  }
  const responseContent: { [k: string]: any } = {};
  responseContent.submitUserRoleEndPoint = "/createuserrole";
  responseContent.securityClassifications = classifications;
  responseContent.submitButtonText = createUserRoleText;

  if (req.session.error) {
    responseContent.error = req.session.error;
    responseContent.update = req.session.error.errorBy === "update" ? true : false;
  }
  res.render("user-roles/create-user-roles", responseContent);
});

// Validate
function validate(req, res, next) {
  const role = new Validator(req.body.role);
  const classification = new Validator(req.body.classification);
  delete req.session.success;
  return (!role.isAlphanumber() || !classification.isAlphanumber());
}
// Validate create
function validateCreate(req, res, next) {
  if (validate(req, res, next)) {
    req.session.error = { status: 401, text: "Please add correct role / classification." };
    res.redirect(302, "/create-user-role-form");
  } else {
    delete req.session.error;
    next();
  }
}

// Validate update
function validateUpdate(req, res, next) {
  if (validate(req, res, next)) {
    const responseContent: { [k: string]: any } = {};
    responseContent.update = true;
    responseContent.role = req.body.role;
    responseContent.submitUserRoleEndPoint = "/updateuserrole";
    responseContent.securityClassifications = classifications;
    responseContent.chosenClassification = req.body.classification;
    responseContent.submitButtonText = updateUserRoleText;
    if (req.session.error) {
      responseContent.error = req.session.error;
    }
    res.render("user-roles/create-user-roles", responseContent);
  } else {
    delete req.session.error;
    next();
  }
}

// Validate update
function validateUpdateForm(req, res, next) {
  if (validate(req, res, next)) {
    req.session.error = { status: 401, text: "Invalid role / classification." };
    res.redirect(302, "/user-roles-list");
  } else {
    delete req.session.error;
    next();
  }
}

router.post("/createuserrole", validateCreate, (req, res, next) => {
  createUserRole(req, new UserRole(sanitize(req.body.role), sanitize(req.body.classification)))
    .then((response) => {
      req.session.success = `User role created.`;
      res.redirect(302, "/user-roles-list");
    })
    .catch((error) => {
      req.session.error = {
        status: 400, text: error.rawResponse ? error.rawResponse :
          error.message ? error.message : "Invalid data",
      };
      res.redirect(302, "/create-user-role-form");
    });
});

router.post("/updateuserroleform", validateUpdateForm, (req, res, next) => {
  const responseContent: { [k: string]: any } = {};
  responseContent.update = true;
  responseContent.role = req.body.role;
  responseContent.submitUserRoleEndPoint = "/updateuserrole";
  responseContent.securityClassifications = classifications;
  responseContent.chosenClassification = req.body.classification;
  responseContent.submitButtonText = updateUserRoleText;
  if (req.session.error) {
    responseContent.error = req.session.error;
  }
  res.render("user-roles/create-user-roles", responseContent);
});

router.post("/updateuserrole", validateUpdate, (req, res, next) => {
  updateUserRole(req, new UserRole(sanitize(req.body.role), sanitize(req.body.classification)))
    .then((response) => {
      req.session.success = `User role updated.`;
      res.redirect(302, "/user-roles-list");
    })
    .catch((error) => {
      req.session.error = {
        errorBy: "update", status: 400, text: error.rawResponse ? error.rawResponse :
          error.message ? error.message : "Invalid data",
      };
      res.redirect(302, "/create-user-role-form");
    });
});

module.exports = router;
export default router;

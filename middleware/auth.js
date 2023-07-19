const jwt = require("jsonwebtoken");

//  Bring the encoded token from cookies that the user was sent
//  verify it and decode
//  and put the token in the request object
//  Run the Route
//  decoded: is the user information that requests the Route
//  next: function that executes new middleware or Route
function checkLogin(req, res, next) {
  const token = req.cookies["access-token"];

  if (!token) return res.status(403).redirect("/login");
  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    if (decoded) {
      req.token = decoded;
      next();
    } else {
      return res.status(401).json({ msg: "You need to login" });
    }
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
}

function authDoctors(req, res, next) {
  const token = req.cookies["access-token"];

  if (!token) return res.status(403).json({ msg: "Access denied." });

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    if (!decoded) {
      return res.status(401).json({ msg: "You need to login" });
    }

    if (decoded.type === "doctor") next();
    else res.status(403).json({ msg: "Access denied." });
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
}

function authDoctorInfo(req, res, next) {
  const token = req.cookies["access-token"];
  if (!token) return res.status(403).json({ msg: "Access denied." });

  try {
    const decoded = jwt.verify(token, process.env.SECRET);

    if (decoded.type === "patient" || parseInt(req.params.id) !== decoded.id) {
      return res.status(403).json({ msg: "Access denied." });
    }
    next();
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
}

function authPatientInfo(req, res, next) {
  const token = req.cookies["access-token"];

  if (!token) return res.status(403).json({ msg: "Access denied." });

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    if (decoded.type === "doctor" || parseInt(req.params.id) !== decoded.id) {
      return res.status(403).json({ msg: "Access denied." });
    }
    next();
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
}

function authPatients(req, res, next) {
  const token = req.cookies["access-token"];

  if (!token) return res.status(403).json({ msg: "Access denied." });

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    if (!decoded) {
      return res.status(401).json({ msg: "You need to login" });
    }

    if (decoded.type === "patient") next();
    else res.status(403).json({ msg: "Access denied." });
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
}

function authPatientDoctors(req, res, next) {
  const token = req.cookies["access-token"];

  if (!token) return res.status(403).json({ msg: "Access denied." });

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    if (!decoded) {
      return res.status(401).json({ msg: "You need to login" });
    }
    if (decoded.type === "patient" && parseInt(req.params.id) !== decoded.id) {
      return res.status(403).json({ msg: "Access denied." });
    }
    next();
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
}

function authDoctorPatients(req, res, next) {
  const token = req.cookies["access-token"];

  if (!token) return res.status(403).json({ msg: "Access denied." });

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    if (!decoded) {
      return res.status(401).json({ msg: "You need to login" });
    }
    if (decoded.type === "doctor" && parseInt(req.params.id) !== decoded.id) {
      return res.status(403).json({ msg: "Access denied." });
    }
    next();
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
}

module.exports = {
  checkLogin,
  authDoctors,
  authPatients,
  authPatientDoctors,
  authDoctorPatients,
  authDoctorInfo,
  authPatientInfo,
};

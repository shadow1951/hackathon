
import jwt from "jsonwebtoken";
import { User } from "./model/user.mjs";

export async function createAccessToken(user) {
  const accessKey = process.env.acessTokenKey;
  try {
    const payload = {
      userid: user._id,
      email: user.email,
    };

    const options = {
      expiresIn: "5h", // Access token expiration
    };

    // Create and return access token
    const accessToken = jwt.sign(payload, accessKey, options);
    console.log("Signed access JWT");
    return accessToken;
  } catch (error) {
    console.error("Error signing access token:", error.message);
    throw new Error("Error signing access token");
  }
}

export async function createRefreshToken(user, res) {
  const refreshKey = process.env.refreashTokenKey;
  try {
    const payload = {
      userid: user._id,
      email: user.email,
    };

    const options = {
      expiresIn: "1d", // Refresh token expiration
    };

    // Create refresh token
    const refreshToken = jwt.sign(payload, refreshKey, options);

    // Set the refresh token in an HttpOnly, Secure cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // Prevent JavaScript access
      secure: process.env.NODE_ENV === "production", // Only over HTTPS in production
      sameSite: "strict", // Mitigate CSRF
      maxAge: 24 * 60 * 60 * 1000, // 1 day expiry (matches token expiration)
    });

    return refreshToken; // Optional return for further use (not needed in most cases)
  } catch (error) {
    console.log("Error signing refresh token:", error.message);
    throw new Error("Error signing refresh token");
  }
}

//example format of incoming header for vallidation
/*Authorization: Bearer abc123def456ghi789
refresh-token: xyz987lmn654opq321*/

export const verifyToken = async (req, res, next) => {
  const accessToken = req.cookies["access_token"];
  const refreshToken = req.cookies["refreshToken"];

  if (!accessToken) {
    return res.status(401).json({ error: "Access token missing" });
  }
  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token missing" });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.acessTokenKey);
    req.user = decoded;

    const user = await User.findById(decoded.userid).select("subscription");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    req.subscription = user.subscription;

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      try {
        if (!process.env.refreashTokenKey) {
          return res.status(500).json({
            error: "Internal server error: Missing refresh token key",
          });
        }

        const decodedRefresh = jwt.verify(
          refreshToken,
          process.env.refreashTokenKey
        );

        const newAccessToken = createAccessToken(decodedRefresh);

        res.cookie("access_token", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 5 * 60 * 60 * 1000,
        });

        const user = await User.findById(decodedRefresh.id).select(
          "subscription"
        );
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        req.subscription = user.subscription;

        return next();
      } catch (refreshError) {
        if (refreshError.name === "TokenExpiredError") {
          return res
            .status(401)
            .json({ error: "Refresh token expired, please log in again" });
        } else {
          return res.status(403).json({ error: "Invalid refresh token" });
        }
      }
    } else {
      return res.status(403).json({ error: error.message });
    }
  }
};

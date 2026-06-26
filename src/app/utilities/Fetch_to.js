export default async function Fetch_to(
  dir,
  payload = {},
  headers = { "x-api-key": process.env.API_KEY || "" },
  retries = 3,
  delay = 1000
) {
  if (!dir || dir === "") {
    if (typeof window !== "undefined") {
      alert("Invalid API Directory not found");
    }

    return {
      success: false,
      message: "Invalid API Directory",
    };
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(dir, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        console.log("Status for fetch:", data);

        return {
          success: true,
          data,
        };
      } else {
        console.log(data?.error);

        return {
          success: false,
          message: data?.error || `Request failed: ${response.status}`,
        };
      }
    } catch (err) {
      let message = "Unknown fetch error";

      if (err instanceof Error) {
        message = err.message;
      }

      console.error(`Attempt ${attempt} fetch error:`, message);
    }

    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  if (typeof window !== "undefined") {
    alert("No Internet Connection. Check your internet connection :(");
  }

  return {
    success: false,
    message: "Server Connections Shutdown",
  };
}
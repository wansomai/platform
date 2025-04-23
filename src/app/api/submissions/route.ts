
import { NextResponse } from "next/server";
import {transporter} from './utils'
import { NextApiRequest } from "next";

export async function POST(request:NextApiRequest) {
  const payload = await request.body.json();
  // Convert payload object to a formatted string for the email
  const formattedPayload = Object.entries(payload)
    .map(([key, value]) => {
      // Handle nested objects (like `primaryContact`, `trainingProgramSelection`, etc.)
      if (typeof value === "object" && value !== null) {
        return `${key}:\n${Object.entries(value)
          .map(([subKey, subValue]) => `  ${subKey}: ${subValue}`)
          .join("\n")}`;
      }
      return `${key}: ${value}`;
    })
    .join("\n\n");

  const mailOptions = {
    from: "engagement@ckccares.com",
    to: ["engagement@ckccares.com"],
    subject: "New Form Submission",
    text: `You have received a new submission:\n\n${formattedPayload}`,
  };

  try {
    
  const response=  await transporter.sendMail(mailOptions);
    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

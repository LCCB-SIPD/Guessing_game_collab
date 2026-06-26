import { NextResponse } from "next/server";
import {
  Keypair,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  Horizon,
  Memo
} from "@stellar/stellar-sdk";

const server = new Horizon.Server("https://horizon-testnet.stellar.org");

export async function POST(req) {
  try {
    const {
      destination,
      amount,
      assetCode,
      assetIssuer,
    } = await req.json();

    const secretKey = process.env.SECRET_KEY || "";

    // Validation
    if (!secretKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Secret key is required.",
        },
        { status: 400 }
      );
    }

    if (!destination) {
      return NextResponse.json(
        {
          success: false,
          error: "Destination address is required.",
        },
        { status: 400 }
      );
    }

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Amount must be greater than 0.",
        },
        { status: 400 }
      );
    }

    const source = Keypair.fromSecret(secretKey);

    const account = await server.loadAccount(source.publicKey());

    const asset =
      assetCode && assetIssuer
        ? new Asset(assetCode, assetIssuer)
        : Asset.native();

    const transaction = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination,
          asset,
          amount,
        })
      )
      .addMemo(Memo.text("Thank you for Playing"))
      .setTimeout(30)
      .build();

    transaction.sign(source);

    const result = await server.submitTransaction(transaction);

    return NextResponse.json(
      {
        success: true,
        message: "Payment sent successfully.",
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Stellar Payment Error:", error);

    // Horizon transaction errors
    if (error.response?.data?.extras?.result_codes) {
      return NextResponse.json(
        {
          success: false,
          error: "Transaction failed.",
          transaction:
            error.response.data.extras.result_codes.transaction,
          operations:
            error.response.data.extras.result_codes.operations,
          details: error.response.data,
        },
        { status: 400 }
      );
    }

    // Horizon API errors
    if (error.response?.data?.detail) {
      return NextResponse.json(
        {
          success: false,
          error: error.response.data.detail,
        },
        { status: 400 }
      );
    }

    // Invalid secret key
    if (error.message?.includes("invalid encoded string")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Stellar secret key.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
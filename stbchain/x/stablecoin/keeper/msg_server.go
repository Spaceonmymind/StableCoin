package keeper

import (
	"context"

	sdkmath "cosmossdk.io/math"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"stbchain/x/stablecoin/types"
)

type msgServer struct {
	Keeper
}

// NewMsgServerImpl returns an implementation of the MsgServer interface
// for the provided Keeper.
func NewMsgServerImpl(keeper Keeper) types.MsgServer {
	return &msgServer{Keeper: keeper}
}

func (s msgServer) Mint(goCtx context.Context, msg *types.MsgMint) (*types.MsgMintResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	// ✅ params через collections: используем context.Context
	params, err := s.GetParams(goCtx)
	if err != nil {
		return nil, err
	}

	if params.Paused {
		return nil, types.ErrPaused
	}
	if msg.Authority != params.Issuer {
		return nil, types.ErrNotIssuer
	}

	to, err := sdk.AccAddressFromBech32(msg.ToAddress)
	if err != nil {
		return nil, err
	}

	amtInt, ok := sdkmath.NewIntFromString(msg.Amount)
	if !ok || !amtInt.IsPositive() {
		return nil, types.ErrInvalidAmount
	}

	coins := sdk.NewCoins(sdk.NewCoin(params.Denom, amtInt))

	// bankKeeper работает через sdk.Context (ctx)
	if err := s.bankKeeper.MintCoins(ctx, types.ModuleName, coins); err != nil {
		return nil, err
	}

	if err := s.bankKeeper.SendCoinsFromModuleToAccount(ctx, types.ModuleName, to, coins); err != nil {
		return nil, err
	}

	return &types.MsgMintResponse{}, nil
}

func (s msgServer) Burn(goCtx context.Context, msg *types.MsgBurn) (*types.MsgBurnResponse, error) {
	ctx := sdk.UnwrapSDKContext(goCtx)

	// ✅ params через collections: используем context.Context
	params, err := s.GetParams(goCtx)
	if err != nil {
		return nil, err
	}

	if params.Paused {
		return nil, types.ErrPaused
	}
	if msg.Authority != params.Issuer {
		return nil, types.ErrNotIssuer
	}

	from, err := sdk.AccAddressFromBech32(msg.FromAddress)
	if err != nil {
		return nil, err
	}

	amtInt, ok := sdkmath.NewIntFromString(msg.Amount)
	if !ok || !amtInt.IsPositive() {
		return nil, types.ErrInvalidAmount
	}

	coins := sdk.NewCoins(sdk.NewCoin(params.Denom, amtInt))

	if err := s.bankKeeper.SendCoinsFromAccountToModule(ctx, from, types.ModuleName, coins); err != nil {
		return nil, err
	}

	if err := s.bankKeeper.BurnCoins(ctx, types.ModuleName, coins); err != nil {
		return nil, err
	}

	return &types.MsgBurnResponse{}, nil
}

var _ types.MsgServer = msgServer{}

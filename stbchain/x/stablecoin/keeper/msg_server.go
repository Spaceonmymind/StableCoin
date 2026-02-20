package keeper

import (
	"context"

	errorsmod "cosmossdk.io/errors"
	sdkmath "cosmossdk.io/math"
	sdk "github.com/cosmos/cosmos-sdk/types"
	sdkerrors "github.com/cosmos/cosmos-sdk/types/errors"

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

	// получаем params через collections
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

	// парсим amount
	amount, ok := sdkmath.NewIntFromString(msg.Amount)
	if !ok || !amount.IsPositive() {
		return nil, types.ErrInvalidAmount
	}

	// проверка max supply
	maxSupply, ok := sdkmath.NewIntFromString(params.MaxSupply)
	if !ok {
		return nil, errorsmod.Wrap(sdkerrors.ErrInvalidRequest, "invalid max supply")
	}

	currentSupply := s.GetTotalSupply(ctx)
	if currentSupply.Add(amount).GT(maxSupply) {
		return nil, errorsmod.Wrap(sdkerrors.ErrInvalidRequest, "exceeds max supply")
	}

	to, err := sdk.AccAddressFromBech32(msg.ToAddress)
	if err != nil {
		return nil, err
	}

	coins := sdk.NewCoins(sdk.NewCoin(params.Denom, amount))

	if err := s.bankKeeper.MintCoins(ctx, types.ModuleName, coins); err != nil {
		return nil, err
	}

	if err := s.bankKeeper.SendCoinsFromModuleToAccount(ctx, types.ModuleName, to, coins); err != nil {
		return nil, err
	}

	// обновляем total supply
	s.SetTotalSupply(ctx, currentSupply.Add(amount))

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

	// обновляем total supply (защита от ухода в минус)
	currentSupply := s.GetTotalSupply(ctx)
	if currentSupply.LT(amtInt) {
		return nil, errorsmod.Wrap(sdkerrors.ErrInvalidRequest, "total supply underflow")
	}
	s.SetTotalSupply(ctx, currentSupply.Sub(amtInt))

	return &types.MsgBurnResponse{}, nil
}

var _ types.MsgServer = msgServer{}

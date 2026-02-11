package keeper_test

import (
	"context"
	"io"
	"testing"

	"cosmossdk.io/log"
	dbm "github.com/cosmos/cosmos-db"
	servertypes "github.com/cosmos/cosmos-sdk/server/types"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"stbchain/app"
	"stbchain/x/stablecoin/keeper"
)

type testAppOptions struct{}

func (testAppOptions) Get(string) interface{} { return nil }

type fixture struct {
	ctx    context.Context // sdk.Context тоже реализует context.Context
	sdkCtx sdk.Context
	keeper keeper.Keeper
	app    *app.App
}

func initFixture(t *testing.T) *fixture {
	t.Helper()

	db := dbm.NewMemDB()
	logger := log.NewNopLogger()

	var appOpts servertypes.AppOptions = testAppOptions{}

	a := app.New(
		logger,
		db,
		io.Discard,
		true, // loadLatest
		appOpts,
	)

	sdkCtx := a.NewContext(false)

	return &fixture{
		ctx:    sdkCtx,
		sdkCtx: sdkCtx,
		keeper: a.StablecoinKeeper,
		app:    a,
	}
}

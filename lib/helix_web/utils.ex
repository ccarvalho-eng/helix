defmodule HelixWeb.Utils do
  @moduledoc """
  Utility functions shared across the web layer.
  """

  @doc """
  Formats Ecto changeset errors into a human-readable string.

  ## Parameters
    - changeset: Ecto.Changeset.t() with errors

  ## Returns
    - String with formatted error messages
  """
  @spec format_changeset_errors(Ecto.Changeset.t()) :: String.t()
  def format_changeset_errors(changeset) do
    changeset
    |> Ecto.Changeset.traverse_errors(&translate_error/1)
    |> Enum.map_join("; ", fn {field, errors} ->
      "#{field}: #{Enum.join(errors, ", ")}"
    end)
  end

  @doc """
  Checks if a resolution context contains an authenticated user.

  ## Parameters
    - resolution: Absinthe.Resolution.t()

  ## Returns
    - `{:ok, User.t()}` if authenticated
    - `{:error, "Not authenticated"}` if not authenticated
  """
  @spec get_current_user(Absinthe.Resolution.t()) ::
          {:ok, Helix.Accounts.User.t()} | {:error, String.t()}
  def get_current_user(%{context: %{current_user: user}}), do: {:ok, user}
  def get_current_user(_resolution), do: not_authenticated_error()

  @doc """
  Macro for requiring authentication in resolvers.

  Returns the authenticated user or an error response.

  ## Example
      def my_resolver(parent, args, resolution) do
        with {:ok, user} <- require_auth(resolution) do
          # resolver logic with authenticated user
        end
      end
  """
  defmacro require_auth(resolution) do
    quote do
      HelixWeb.Utils.get_current_user(unquote(resolution))
    end
  end

  defp translate_error({msg, opts}) do
    Enum.reduce(opts, msg, fn {key, value}, acc ->
      String.replace(acc, "%{#{key}}", inspect(value))
    end)
  end

  defp not_authenticated_error, do: {:error, "Not authenticated"}
end
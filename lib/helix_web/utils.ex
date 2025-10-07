defmodule HelixWeb.Utils do
  @moduledoc """
  Utility functions shared across the web layer.
  """

  @doc """
  Formats Ecto changeset errors into a human-readable string.
  """
  @spec format_changeset_errors(Ecto.Changeset.t()) :: String.t()
  def format_changeset_errors(changeset) do
    changeset
    |> Ecto.Changeset.traverse_errors(&translate_error/1)
    |> Enum.map_join("\n", fn {field, errors} ->
      field_name = humanize_field_name(field)
      formatted_errors = Enum.map_join(errors, ", ", &capitalize_error(&1, field_name))
      "#{field_name}: #{formatted_errors}"
    end)
  end

  @doc """
  Checks if a resolution context contains an authenticated user.
  """
  @spec get_current_user(Absinthe.Resolution.t()) ::
          {:ok, Helix.Accounts.User.t()} | {:error, String.t()}
  def get_current_user(%{context: %{current_user: user}}), do: {:ok, user}
  def get_current_user(_resolution), do: {:error, "Not authenticated"}

  @doc """
  Macro for requiring authentication in resolvers.
  """
  defmacro require_auth(resolution) do
    quote do
      HelixWeb.Utils.get_current_user(unquote(resolution))
    end
  end

  # Private functions

  defp translate_error({msg, opts}) do
    Enum.reduce(opts, msg, fn {key, value}, acc ->
      String.replace(acc, "%{#{key}}", inspect(value))
    end)
  end

  defp humanize_field_name(field) do
    case field do
      :email -> "Email"
      :password -> "Password"
      :first_name -> "First name"
      :last_name -> "Last name"
      field -> field |> to_string() |> String.capitalize()
    end
  end

  defp capitalize_error(error, field_name) do
    error
    |> String.replace(~r/^#{String.downcase(field_name)}\s+/, "")
    |> String.capitalize()
  end
end

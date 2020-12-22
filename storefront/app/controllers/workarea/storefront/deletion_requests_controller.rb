module Workarea
  module Storefront
    class DeletionRequestsController < ApplicationController
      def show
        model = Email::DeletionRequest.new(deletion_request_params)
        @deletion_request = DeletionRequestViewModel.wrap(model, view_model_options)
      end

      def create
        model = Email::DeletionRequest.new(deletion_request_params)

        if model.save
          DeletionMailer.confirmation(model.id.to_s).deliver_later
          flash[:success] = t('workarea.storefront.flash_messages.deletion_request_created')
          redirect_to root_path
        else
          @deletion_request = DeletionRequestViewModel.wrap(model, options)

          flash[:error] = t('workarea.storefront.flash_messages.deletion_request_create_error')
          render :new
        end
      end

      def destroy
        @deletion_request = Email::DeletionRequest.find_by_token(params[:id])

        if @deletion_request&.completed?
          flash[:error] = t('workarea.storefront.flash_messages.deletion_request_cancel_error')
        else
          @deletion_request&.destroy!
          flash[:success] = t('workarea.storefront.flash_messages.deletion_request_canceled')
        end

        redirect_to root_path
      end

      private

      def deletion_request_params
        params.permit(:email)
      end
    end
  end
end
